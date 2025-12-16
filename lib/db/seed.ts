import fs from "fs";
import path from "path";
import csv from "csv-parser";
import { config } from "dotenv";
import { format } from "node-pg-format";
import { AuroraDSQLPool } from "@aws/aurora-dsql-node-postgres-connector";
import { awsCredentialsProvider } from "@vercel/oidc-aws-credentials-provider";

config({ path: ".env.local" });
config();

async function readMovieTitlesFromCSV(): Promise<string[]> {
  const movieTitles = new Set<string>();
  const csvFilePath = path.resolve(__dirname, "movies.csv");

  return new Promise((resolve, reject) => {
    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on("data", (row) => {
        const title = row.title?.trim();
        if (title) {
          movieTitles.add(title);
        }
      })
      .on("end", () => {
        const uniqueMovieTitles = Array.from(movieTitles);
        console.log(
          `Parsed ${uniqueMovieTitles.length} unique movies from CSV.`,
        );
        resolve(uniqueMovieTitles);
      })
      .on("error", (error) => {
        console.error("Error reading CSV file:", error);
        reject(error);
      });
  });
}

// Retries make data loading robust against transient infrastructure failures and conflicts
// (Optimistic Concurrency Control conflicts) caused by other clients running conflicting
// transactions.
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 5,
  initialDelayMs: number = 1000,
): Promise<T> {
  let lastError: any;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries) {
        const delayMs = initialDelayMs * Math.pow(2, attempt);
        console.log(
          `Attempt ${attempt + 1} failed, retrying in ${delayMs}ms...`,
        );
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }
  throw lastError;
}

async function insertBatch(
  pool: any,
  movieTitles: string[],
  startIndex: number,
  batchSize: number,
  defaultDate: Date,
): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const batch = movieTitles.slice(startIndex, startIndex + batchSize);
    const data = batch.map((title, j) => [
      startIndex + j + 1,
      title,
      0,
      defaultDate,
    ]);

    const query = format(
      "INSERT INTO movies (id, title, score, last_vote_time) VALUES %L ON CONFLICT (id) DO NOTHING",
      data,
    );
    await client.query(query);

    await client.query("COMMIT");
    console.log(
      `Inserted ${Math.min(startIndex + batchSize, movieTitles.length)} / ${movieTitles.length} movies`,
    );
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function main() {
  const movieTitles = await readMovieTitlesFromCSV();
  const defaultDate = new Date("2024-12-07");
  const batchSize = 500;

  const pool = new AuroraDSQLPool({
    host: process.env.PGHOST!,
    region: process.env.AWS_REGION!,
    user: process.env.PGUSER || "admin",
    database: process.env.PGDATABASE || "postgres",
    port: Number(process.env.PGPORT || 5432),
    customCredentialsProvider: awsCredentialsProvider({
      roleArn: process.env.AWS_ROLE_ARN!,
      clientConfig: { region: process.env.AWS_REGION! },
    }),
  });
  try {
    for (let i = 0; i < movieTitles.length; i += batchSize) {
      await retryWithBackoff(() =>
        insertBatch(pool, movieTitles, i, batchSize, defaultDate),
      );
    }
  } finally {
    await pool.end();
  }

  console.log(`Seeded ${movieTitles.length} movies`);
  process.exit();
}

main().catch((error) => {
  console.error("Seeding failed:", error);
  process.exit(1);
});

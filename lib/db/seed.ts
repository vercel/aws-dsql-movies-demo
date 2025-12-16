import fs from "fs";
import path from "path";
import csv from "csv-parser";
import { config } from "dotenv";
import { DsqlSigner } from "@aws-sdk/dsql-signer";
import { awsCredentialsProvider } from "@vercel/oidc-aws-credentials-provider";
import { Client } from "pg";

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

async function main() {
  const movieTitles = await readMovieTitlesFromCSV();

  const signer = new DsqlSigner({
    hostname: process.env.PGHOST!,
    region: process.env.AWS_REGION!,
    expiresIn: 3600,
    credentials: awsCredentialsProvider({
      roleArn: process.env.AWS_ROLE_ARN!,
      clientConfig: { region: process.env.AWS_REGION! },
    }),
  });
  const client = new Client({
    host: process.env.PGHOST!,
    database: process.env.PGDATABASE!,
    user: process.env.PGUSER || "admin",
    // The auth token value can be cached for up to 15 minutes (900 seconds) if desired.
    password: () => signer.getDbConnectAdminAuthToken(),
    port: Number(process.env.PGPORT!),
    ssl: true,
  });
  try {
    const defaultDate = new Date("2024-12-07");
    const batchSize = 200;
    for (let i = 0; i < movieTitles.length; i += batchSize) {
      try {
        await client.query("BEGIN");

        const batch = movieTitles.slice(i, i + batchSize);
        for (let j = 0; j < batch.length; j++) {
          await client.query(
            "INSERT INTO movies (id, title, score, last_vote_time) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO NOTHING",
            [i + j + 1, batch[j], 0, defaultDate],
          );
        }

        await client.query("COMMIT");
        console.log(
          `Inserted ${Math.min(i + batchSize, movieTitles.length)} / ${movieTitles.length} movies`,
        );
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      }
    }
    console.log(`Seeded ${movieTitles.length} movies`);
  } finally {
    client.end();
    process.exit();
  }
}

main().catch((error) => {
  console.error("Seeding failed:", error);
  process.exit(1);
});

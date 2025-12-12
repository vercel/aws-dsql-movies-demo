import fs from "fs";
import path from "path";
import csv from "csv-parser";
import { closeConnection, getConnection } from "./db";
import { config } from "dotenv";

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
  const pool = await getConnection();
  const movieTitles = await readMovieTitlesFromCSV();
  const defaultDate = new Date("2024-12-07");
  const batchSize = 200;

  for (let i = 0; i < movieTitles.length; i += batchSize) {
    const client = await pool.connect();
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
    } finally {
      client.release();
    }
  }

  console.log(`Seeded ${movieTitles.length} movies`);
  await closeConnection();
  process.exit();
}

main().catch((error) => {
  console.error("Seeding failed:", error);
  process.exit(1);
});

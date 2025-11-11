import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import { closePool, getPool } from './db';
import { config } from 'dotenv';
import { format } from 'node-pg-format';

config({ path: '.env.local' });
config();

async function readMovieTitlesFromCSV(): Promise<string[]> {
  const movieTitles = new Set<string>();
  const csvFilePath = path.resolve(__dirname, 'movies.csv');

  return new Promise((resolve, reject) => {
    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on('data', (row) => {
        const title = row.title?.trim();
        if (title) {
          movieTitles.add(title);
        }
      })
      .on('end', () => {
        const uniqueMovieTitles = Array.from(movieTitles);
        console.log(
          `Parsed ${uniqueMovieTitles.length} unique movies from CSV.`,
        );
        resolve(uniqueMovieTitles);
      })
      .on('error', (error) => {
        console.error('Error reading CSV file:', error);
        reject(error);
      });
  });
}

async function main() {
  const pool = await getPool();
  const movieTitles = await readMovieTitlesFromCSV();
  const defaultDate = new Date('2024-12-07');
  const batchSize = 500;

  for (let i = 0; i < movieTitles.length; i += batchSize) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const titles = movieTitles.slice(i, i + batchSize);
      const data = titles.map((title, j) => [i + j + 1, title, 0, defaultDate]);

      const query = format(
        'INSERT INTO movies (id, title, score, last_vote_time) VALUES %L ON CONFLICT (id) DO NOTHING',
        data,
      );
      await client.query(query);

      await client.query('COMMIT');
      console.log(
        `Inserted ${Math.min(i + batchSize, movieTitles.length)} / ${movieTitles.length} movies`,
      );
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  await closePool();

  console.log(`Seeded ${movieTitles.length} movies`);
  process.exit();
}

main().catch((error) => {
  console.error('Seeding failed:', error);
  process.exit(1);
});

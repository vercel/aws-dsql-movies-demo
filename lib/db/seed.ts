import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import { seed } from 'drizzle-seed';
import { closeConnection, getConnection } from './drizzle';
import { movies } from './schema';
import { config } from 'dotenv';

config();

async function readMovieTitlesFromCSV(): Promise<string[]> {
  const movieTitles: string[] = [];
  const csvFilePath = path.resolve(__dirname, 'movies.csv');

  return new Promise((resolve, reject) => {
    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on('data', (row) => {
        const title = row.title?.trim();
        if (title) {
          movieTitles.push(title);
        }
      })
      .on('end', () => {
        console.log(`Parsed ${movieTitles.length} movies from CSV.`);
        resolve(movieTitles);
      })
      .on('error', (error) => {
        console.error('Error reading CSV file:', error);
        reject(error);
      });
  });
}

async function main() {
  const db = await getConnection();
  const movieTitles = await readMovieTitlesFromCSV();

  await seed(db, { movies }).refine((f) => ({
    movies: {
      columns: {
        id: f.intPrimaryKey(),
        title: f.valuesFromArray({
          values: movieTitles,
          isUnique: true,
        }),
        score: f.int({
          minValue: 0,
          maxValue: 0,
          isUnique: false,
        }),
        lastVoteTime: f.default({
          defaultValue: new Date('2024-12-07'),
        }),
      },
      count: movieTitles.length,
    },
  }));

  await closeConnection();
  process.exit();
}

main().catch((error) => {
  console.error('Seeding failed:', error);
  process.exit(1);
});

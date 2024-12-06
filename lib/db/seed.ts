import { seed } from 'drizzle-seed';
import { closeConnection, getConnection } from './drizzle';
import { movies } from './schema';

const movieTitles = [
  'The Shawshank Redemption',
  'The Godfather',
  'The Dark Knight',
  '12 Angry Men',
  "Schindler's List",
  'The Lord of the Rings: The Return of the King',
  'Pulp Fiction',
  'The Good, the Bad and the Ugly',
  'Forrest Gump',
  'Inception',
];

async function main() {
  const db = await getConnection();

  await seed(db, { movies }).refine((f) => ({
    movies: {
      columns: {
        id: f.intPrimaryKey(),
        title: f.valuesFromArray({
          values: movieTitles,
          isUnique: true,
        }),
        upvotes: f.int({
          minValue: 0,
          maxValue: 100,
          isUnique: false,
        }),
        downvotes: f.int({
          minValue: 0,
          maxValue: 0,
          isUnique: false,
        }),
        lastVoteTime: f.datetime(),
      },
      count: movieTitles.length,
    },
  }));

  await closeConnection();
  process.exit();
}

main();

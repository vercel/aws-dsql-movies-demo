import { InferSelectModel } from 'drizzle-orm';
import { getConnection } from './drizzle';
import { movies } from './schema';

export type Movie = InferSelectModel<typeof movies>;

export async function getMovies() {
  const db = await getConnection();
  return db.select().from(movies);
}

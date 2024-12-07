'use server';

import { Movie } from '@/lib/db/queries';
import { getConnection } from './drizzle';
import { movies } from './schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function voteAction(updatedMovie: Movie) {
  const db = await getConnection();
  await db
    .update(movies)
    .set({ score: updatedMovie.score, lastVoteTime: updatedMovie.lastVoteTime })
    .where(eq(movies.id, updatedMovie.id));

  revalidatePath('/');
}

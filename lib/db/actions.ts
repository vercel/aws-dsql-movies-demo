'use server';

import { Movie } from '@/lib/db/queries';
import { getConnection } from './drizzle';
import { movies, sessions, votes } from './schema';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

export async function voteAction(
  movie: Movie,
  score: number,
  lastVoteTime: Date,
) {
  const db = await getConnection();
  const cookieStore = await cookies();

  let sessionId = cookieStore.get('sessionId')?.value;
  if (!sessionId) {
    const newSession = await db
      .insert(sessions)
      .values({
        // 30 days from now
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      })
      .returning({ id: sessions.id });

    sessionId = newSession[0].id;
    cookieStore.set('sessionId', sessionId, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
    });
  }

  const existingVote = await db
    .select()
    .from(votes)
    .where(and(eq(votes.sessionId, sessionId), eq(votes.movieId, movie.id)))
    .limit(1);

  if (existingVote.length > 0) {
    return movie;
  }

  await db.insert(votes).values({
    sessionId,
    movieId: movie.id,
  });

  await db
    .update(movies)
    .set({ score, lastVoteTime })
    .where(eq(movies.id, movie.id));

  revalidatePath('/');
}

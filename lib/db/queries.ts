import { getConnection } from './drizzle';
import { movies, votes } from './schema';
import { and, eq, sql } from 'drizzle-orm';

export interface Movie {
  id: number;
  title: string;
  score: number;
  lastVoteTime: Date;
  hasVoted: boolean;
}

export async function getMovies(sessionId?: string) {
  const db = await getConnection();

  const moviesWithVotes = await db
    .select({
      id: movies.id,
      title: movies.title,
      score: movies.score,
      lastVoteTime: movies.lastVoteTime,
      hasVoted: sql<boolean>`${votes.id} is not null`,
    })
    .from(movies)
    .leftJoin(
      votes,
      and(
        eq(votes.movieId, movies.id),
        sessionId ? eq(votes.sessionId, sessionId) : undefined,
      ),
    );

  return moviesWithVotes.map((movie) => ({
    ...movie,
    hasVoted: Boolean(movie.hasVoted),
  }));
}

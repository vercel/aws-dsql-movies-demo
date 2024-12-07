import { getConnection } from './drizzle';
import { movies, votes } from './schema';
import { and, eq, sql } from 'drizzle-orm';
import { performance } from 'perf_hooks';

export interface Movie {
  id: number;
  title: string;
  score: number;
  lastVoteTime: Date;
  hasVoted: boolean;
}

export interface MoviesResult {
  movies: Movie[];
  queryTimeMs: string;
}

export async function getMovies(sessionId?: string) {
  const db = await getConnection();

  const hasVoted = sessionId
    ? sql<boolean>`CASE WHEN COUNT(${votes.id}) > 0 THEN true ELSE false END`
    : sql<boolean>`false`;

  const startTime = performance.now();

  const moviesWithVotes = await db
    .select({
      id: movies.id,
      title: movies.title,
      score: movies.score,
      lastVoteTime: movies.lastVoteTime,
      hasVoted,
    })
    .from(movies)
    .leftJoin(
      votes,
      and(
        eq(votes.movieId, movies.id),
        sessionId ? eq(votes.sessionId, sql`${sessionId}::uuid`) : undefined,
      ),
    )
    .groupBy(movies.id, movies.title, movies.score, movies.lastVoteTime);

  const endTime = performance.now();
  const queryTimeMs = (endTime - startTime).toFixed(2);

  console.log(`Database query took ${queryTimeMs} ms`);

  const data = moviesWithVotes.map((movie) => ({
    ...movie,
    hasVoted: Boolean(movie.hasVoted),
  }));

  return { movies: data, queryTimeMs };
}

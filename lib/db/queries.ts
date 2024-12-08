import { getConnection } from './drizzle';
import { movies, votes } from './schema';
import { and, eq, ilike, sql, desc } from 'drizzle-orm';
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
  totalRecords: number;
  queryTimeMs: string;
}

export async function getMovies(sessionId?: string, filter?: string) {
  const db = await getConnection();
  const startTime = performance.now();

  let filterCondition = undefined;
  if (filter) {
    filterCondition = ilike(movies.title, `%${filter}%`);
  }

  const totalRecordsResult = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(movies)
    .where(filterCondition);

  const totalRecords = Number(totalRecordsResult[0]?.count) || 0;

  let moviesQuery = db
    .select({
      id: movies.id,
      title: movies.title,
      score: movies.score,
      lastVoteTime: movies.lastVoteTime,
    })
    .from(movies)
    .where(filterCondition)
    .orderBy(desc(movies.score))
    .limit(8);

  let moviesWithVotes;

  if (sessionId) {
    moviesWithVotes = await db
      .select({
        id: movies.id,
        title: movies.title,
        score: movies.score,
        lastVoteTime: movies.lastVoteTime,
        hasVoted: sql<boolean>`CASE WHEN ${votes.sessionId} IS NOT NULL THEN true ELSE false END`,
      })
      .from(movies)
      .leftJoin(
        votes,
        and(
          eq(votes.movieId, movies.id),
          eq(votes.sessionId, sql`${sessionId}::uuid`),
        ),
      )
      .where(filterCondition)
      .orderBy(desc(movies.score))
      .limit(8);
  } else {
    moviesWithVotes = await moviesQuery;
  }

  const endTime = performance.now();
  const queryTimeMs = (endTime - startTime).toFixed(2);

  console.log(`Database query took ${queryTimeMs} ms`);

  const data = moviesWithVotes.map((movie) => ({
    ...movie,
    // @ts-ignore
    hasVoted: Boolean(movie.hasVoted),
  }));

  return { movies: data, totalRecords, queryTimeMs };
}

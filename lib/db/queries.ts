import { getConnection } from './drizzle';
import { movies, votes } from './schema';
import { and, eq, ilike, sql } from 'drizzle-orm';
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

export async function getMovies(
  sessionId?: string,
  filter?: string,
): Promise<MoviesResult> {
  const db = await getConnection();
  const startTime = performance.now();
  const conditions = [];

  if (filter) {
    conditions.push(ilike(movies.title, `%${filter}%`));
  }

  const whereCondition = conditions.length > 0 ? and(...conditions) : undefined;

  const totalRecordsResult = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(movies)
    .where(whereCondition);

  const totalRecords = totalRecordsResult[0]?.count || 0;

  let moviesWithVotes;

  if (sessionId) {
    moviesWithVotes = await db
      .select({
        id: movies.id,
        title: movies.title,
        score: movies.score,
        lastVoteTime: movies.lastVoteTime,
        hasVoted: sql<boolean>`BOOL_OR(votes.session_id = ${sessionId}::uuid)`,
      })
      .from(movies)
      .leftJoin(
        votes,
        and(
          eq(votes.movieId, movies.id),
          eq(votes.sessionId, sql`${sessionId}::uuid`),
        ),
      )
      .where(whereCondition)
      .groupBy(movies.id, movies.title, movies.score, movies.lastVoteTime)
      .orderBy(sql`${movies.score} DESC`)
      .limit(8);
  } else {
    moviesWithVotes = await db
      .select({
        id: movies.id,
        title: movies.title,
        score: movies.score,
        lastVoteTime: movies.lastVoteTime,
        hasVoted: sql<boolean>`false`,
      })
      .from(movies)
      .where(whereCondition)
      .orderBy(sql`${movies.score} DESC`)
      .limit(8);
  }

  const endTime = performance.now();
  const queryTimeMs = (endTime - startTime).toFixed(2);

  console.log(`Database query took ${queryTimeMs} ms`);

  const data = moviesWithVotes.map((movie) => ({
    ...movie,
    hasVoted: Boolean(movie.hasVoted),
  }));

  return { movies: data, totalRecords, queryTimeMs };
}

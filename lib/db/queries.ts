import { getPool } from './db';
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
  const pool = await getPool();
  const startTime = performance.now();

  const params: any[] = [];
  let whereClause = '';

  if (filter) {
    whereClause = 'WHERE m.title ILIKE $1';
    params.push(`%${filter}%`);
  }

  const countResult = await pool.query(
    `SELECT COUNT(*) as count FROM movies m ${whereClause}`,
    params,
  );
  const totalRecords = Number(countResult.rows[0]?.count) || 0;

  let moviesResult;
  if (sessionId) {
    const queryParams = filter ? [`%${filter}%`, sessionId] : [sessionId];
    const paramIndex = filter ? 2 : 1;
    moviesResult = await pool.query(
      `SELECT
        m.id,
        m.title,
        m.score,
        m.last_vote_time as "lastVoteTime",
        CASE WHEN v.session_id IS NOT NULL THEN true ELSE false END as "hasVoted"
      FROM movies m
      LEFT JOIN votes v ON v.movie_id = m.id AND v.session_id = $${paramIndex}::uuid
      ${whereClause}
      ORDER BY m.score DESC
      LIMIT 8`,
      queryParams,
    );
  } else {
    moviesResult = await pool.query(
      `SELECT id, title, score, last_vote_time as "lastVoteTime", false as "hasVoted"
      FROM movies m
      ${whereClause}
      ORDER BY m.score DESC
      LIMIT 8`,
      params,
    );
  }

  const endTime = performance.now();
  const queryTimeMs = (endTime - startTime).toFixed(2);

  console.log(`Database query took ${queryTimeMs} ms`);

  return { movies: moviesResult.rows, totalRecords, queryTimeMs };
}

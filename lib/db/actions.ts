"use server";

import { Movie } from "@/lib/db/queries";
import { getPool } from "./db";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

export async function voteAction(
  movie: Movie,
  score: number,
  lastVoteTime: Date,
) {
  const pool = await getPool();
  const cookieStore = await cookies();

  let sessionId = cookieStore.get("sessionId")?.value;
  if (!sessionId) {
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const result = await pool.query(
      "INSERT INTO sessions (expires_at) VALUES ($1) RETURNING id",
      [expiresAt],
    );

    sessionId = result.rows[0].id;
    cookieStore.set("sessionId", String(sessionId), {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
    });
  }

  const existingVote = await pool.query(
    "SELECT id FROM votes WHERE session_id = $1 AND movie_id = $2 LIMIT 1",
    [sessionId, movie.id],
  );

  if (existingVote.rows.length > 0) {
    return movie;
  }

  await pool.query("INSERT INTO votes (session_id, movie_id) VALUES ($1, $2)", [
    sessionId,
    movie.id,
  ]);

  await pool.query(
    "UPDATE movies SET score = $1, last_vote_time = $2 WHERE id = $3",
    [score, lastVoteTime, movie.id],
  );

  revalidatePath("/");
}

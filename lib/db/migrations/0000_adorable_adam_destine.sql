-- Individual statements should be separated by a blank line
CREATE TABLE IF NOT EXISTS "movies" (
	"id" integer PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"score" integer NOT NULL,
	"last_vote_time" timestamp NOT NULL
);

CREATE TABLE IF NOT EXISTS "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL
);

CREATE TABLE IF NOT EXISTS "votes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"movie_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX ASYNC IF NOT EXISTS "movies_score_idx" ON "movies" ("score");

CREATE INDEX ASYNC IF NOT EXISTS "movies_group_by_idx" ON "movies" ("id","title","score","last_vote_time");

CREATE INDEX ASYNC IF NOT EXISTS "movies_title_idx" ON "movies" ("title");

CREATE UNIQUE INDEX ASYNC IF NOT EXISTS "votes_movieId_sessionId_idx" ON "votes" ("movie_id","session_id");

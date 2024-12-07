CREATE TABLE IF NOT EXISTS "movies" (
	"id" integer PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"score" integer NOT NULL,
	"last_vote_time" timestamp NOT NULL
);

CREATE TABLE IF NOT EXISTS "movies" (
	"id" integer PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"upvotes" integer NOT NULL,
	"downvotes" integer NOT NULL,
	"last_vote_time" timestamp NOT NULL
);

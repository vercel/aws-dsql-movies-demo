import { integer, text, timestamp, pgTable } from 'drizzle-orm/pg-core';

export const movies = pgTable('movies', {
  id: integer('id').primaryKey(),
  title: text('title').notNull(),
  score: integer('score').notNull(),
  lastVoteTime: timestamp('last_vote_time').notNull(),
});

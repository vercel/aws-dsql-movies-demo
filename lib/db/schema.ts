import {
  pgTable,
  integer,
  timestamp,
  uuid,
  uniqueIndex,
  text,
} from 'drizzle-orm/pg-core';

export const movies = pgTable(
  'movies',
  {
    id: integer('id').primaryKey(),
    title: text('title').notNull(),
    score: integer('score').notNull(),
    lastVoteTime: timestamp('last_vote_time').notNull(),
  },
  (table) => ({
    scoreIdx: uniqueIndex('movies_score_idx').on(table.score),
  }),
);

export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  expiresAt: timestamp('expires_at').notNull(),
});

export const votes = pgTable(
  'votes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    sessionId: uuid('session_id')
      .notNull()
      .references(() => sessions.id),
    movieId: integer('movie_id')
      .notNull()
      .references(() => movies.id),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    movieSessionIdx: uniqueIndex('votes_movieId_sessionId_idx').on(
      table.movieId,
      table.sessionId,
    ),
  }),
);

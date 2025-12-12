import type { Config } from "drizzle-kit";

export default {
  schema: "./lib/db/schema.ts",
  out: "./lib/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    host: process.env.PGHOST!,
    user: "admin",
    password: process.env.PGPASSWORD!,
    database: "postgres",
    port: 5432,
    ssl: true,
  },
} satisfies Config;

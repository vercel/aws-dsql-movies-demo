import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { AuroraDSQLPool } from "@aws/aurora-dsql-node-postgres-connector";
import { awsCredentialsProvider } from "@vercel/oidc-aws-credentials-provider";

dotenv.config({ path: ".env.local" });
dotenv.config();

async function main() {
  const pool = new AuroraDSQLPool({
    host: process.env.PGHOST!,
    region: process.env.AWS_REGION!,
    user: process.env.PGUSER || "admin",
    database: process.env.PGDATABASE || "postgres",
    port: Number(process.env.PGPORT || 5432),
    customCredentialsProvider: awsCredentialsProvider({
      roleArn: process.env.AWS_ROLE_ARN!,
      clientConfig: { region: process.env.AWS_REGION! },
    }),
  });
  const client = await pool.connect();

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id integer PRIMARY KEY,
        name text NOT NULL,
        executed_at bigint
      )
    `);

    const migrationsFolder = path.join(process.cwd(), "/lib/db/migrations");
    const migrationFiles = fs
      .readdirSync(migrationsFolder)
      .filter((f) => f.endsWith(".sql"))
      .sort();

    for (const file of migrationFiles) {
      const result = await client.query(
        "SELECT name FROM migrations WHERE name = $1",
        [file],
      );

      if (result.rows.length === 0) {
        console.log(`Running migration: ${file}`);
        const filePath = path.join(migrationsFolder, file);
        const migration = fs.readFileSync(filePath, "utf8");
        const statements = migration
          .split("\n\n")
          .map((s) => s.trim())
          .filter((s) => s.length > 0);

        for (const statement of statements) {
          try {
            await client.query("BEGIN");
            await client.query(statement);
            await client.query("COMMIT");
          } catch (error: any) {
            await client.query("ROLLBACK");
            if (error.message?.includes("already exists")) {
              console.log("Skipping duplicate constraint");
            } else {
              throw error;
            }
          }
        }

        const maxId = await client.query(
          "SELECT COALESCE(MAX(id), 0) + 1 as next_id FROM migrations",
        );
        await client.query(
          "INSERT INTO migrations (id, name, executed_at) VALUES ($1, $2, $3)",
          [maxId.rows[0].next_id, file, Date.now()],
        );
      }
    }

    console.log("Migrations complete");
  } finally {
    client.release();
    await pool.end();
  }
}

main();

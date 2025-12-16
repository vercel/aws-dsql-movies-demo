import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { DsqlSigner } from "@aws-sdk/dsql-signer";
import { awsCredentialsProvider } from "@vercel/oidc-aws-credentials-provider";
import { Client } from "pg";

dotenv.config({ path: ".env.local" });
dotenv.config();

async function main() {
  const signer = new DsqlSigner({
    hostname: process.env.PGHOST!,
    region: process.env.AWS_REGION!,
    expiresIn: 3600,
    credentials: awsCredentialsProvider({
      roleArn: process.env.AWS_ROLE_ARN!,
      clientConfig: { region: process.env.AWS_REGION! },
    }),
  });
  const client = new Client({
    host: process.env.PGHOST!,
    database: process.env.PGDATABASE!,
    user: process.env.PGUSER || "admin",
    // The auth token value can be cached for up to 15 minutes (900 seconds) if desired.
    password: () => signer.getDbConnectAdminAuthToken(),
    port: Number(process.env.PGPORT!),
    ssl: true,
  });
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
          .split("--> statement-breakpoint")
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
    client.end();
  }
}

main();

import { awsCredentialsProvider } from "@vercel/oidc-aws-credentials-provider";
import { AuroraDSQLPool } from "@aws/aurora-dsql-node-postgres-connector";
import { Pool } from "pg";
import { attachDatabasePool } from "@vercel/functions";

let pool: Pool | null = null;

export async function getPool() {
  if (pool) {
    return pool;
  }

  try {
    pool = new AuroraDSQLPool({
      host: process.env.PGHOST!,
      region: process.env.AWS_REGION || "us-east-1",
      user: process.env.PGUSER || "admin",
      database: process.env.PGDATABASE || "postgres",
      port: Number(process.env.PGPORT || 5432),
      customCredentialsProvider: awsCredentialsProvider({
        roleArn: process.env.AWS_ROLE_ARN!,
      }),
    });
    attachDatabasePool(pool);
    return pool;
  } catch (error) {
    console.error("Failed to create database connection pool:", error);
    throw error;
  }
}

export async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

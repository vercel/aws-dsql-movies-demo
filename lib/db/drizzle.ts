import { awsCredentialsProvider } from '@vercel/functions/oidc';
import { DsqlSigner } from '@aws-sdk/dsql-signer';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { config } from 'dotenv';

config();

let pool: Pool | null = null;
let db: NodePgDatabase<typeof schema> | null = null;

export async function getToken() {
  const env = process.env.VERCEL_ENV;
  const isNotLocal = env === 'preview' || env === 'production';
  const credentials = isNotLocal && {
    credentials: awsCredentialsProvider({
      roleArn: process.env.AWS_ROLE_ARN!,
    }),
  };

  const signer = new DsqlSigner({
    hostname: process.env.DB_CLUSTER_ENDPOINT!,
    region: 'us-east-1',
    ...credentials,
  });

  const token = await signer.getDbConnectAdminAuthToken();
  return token;
}

export async function getConnection() {
  if (db) {
    return db;
  }

  try {
    pool = new Pool({
      host: process.env.DB_CLUSTER_ENDPOINT!,
      user: 'admin',
      password: await getToken(),
      database: 'postgres',
      port: 5432,
      ssl: true,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
    db = drizzle(pool, { schema });
    return db;
  } catch (error) {
    console.error('Failed to create database connection:', error);
    throw error;
  }
}

export async function closeConnection() {
  if (pool) {
    await pool.end();
    pool = null;
    db = null;
  }
}

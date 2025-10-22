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
let cachedToken: { token: string; expiresAt: Date } | null = null;

function getHostname() {
  const clusterId = process.env.DB_CLUSTER_ID;
  const region = process.env.AWS_REGION || 'us-east-1';

  if (!clusterId) {
    throw new Error('DB_CLUSTER_ID environment variable is required');
  }

  return `${clusterId}.dsql.${region}.on.aws`;
}

export async function getToken() {
  const now = new Date();
  if (cachedToken && cachedToken.expiresAt > now) {
    return cachedToken.token;
  }

  const region = process.env.AWS_REGION || 'us-east-1';
  const signer = new DsqlSigner({
    hostname: getHostname(),
    region: region,
    credentials: awsCredentialsProvider({
      roleArn: process.env.AWS_ROLE_ARN!,
    }),
  });

  const token = await signer.getDbConnectAdminAuthToken();

  // Token is valid for 15 minutes; set to 14 minutes to be safe
  const expiresAt = new Date(now.getTime() + 14 * 60 * 1000);
  cachedToken = { token, expiresAt };

  return token;
}

export async function getConnection() {
  const now = new Date();

  // Check if pool exists and token is still valid
  if (db && cachedToken && cachedToken.expiresAt > now) {
    return db;
  }

  // Token is expired or pool is null, recreate pool and db
  try {
    if (pool) {
      // Close the existing pool
      await pool.end();
      pool = null;
      db = null;
    }

    const token = await getToken();

    pool = new Pool({
      host: getHostname(),
      user: 'admin',
      password: token,
      database: 'postgres',
      port: 5432,
      ssl: true,
      max: 20,
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

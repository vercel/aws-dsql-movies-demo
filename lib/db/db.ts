import { awsCredentialsProvider } from '@vercel/functions/oidc';
import { DsqlSigner } from '@aws-sdk/dsql-signer';
import { Pool } from 'pg';
import { config } from 'dotenv';

config();

let pool: Pool | null = null;
let cachedToken: { token: string; expiresAt: Date } | null = null;

export async function getToken() {
  const now = new Date();
  if (cachedToken && cachedToken.expiresAt > now) {
    return cachedToken.token;
  }

  const region = process.env.AWS_REGION || 'us-east-1';
  // DSQL token max validity is 604,800 seconds (1 week). We are using 1 hour in this case.
  const expiresInSeconds = 3600;
  const signer = new DsqlSigner({
    hostname: process.env.DB_CLUSTER_ENDPOINT!,
    region: region,
    expiresIn: expiresInSeconds,
    credentials: awsCredentialsProvider({
      roleArn: process.env.AWS_ROLE_ARN!,
    }),
  });

  const token = await signer.getDbConnectAdminAuthToken();

  const expiresAt = new Date(now.getTime() + (expiresInSeconds - 60) * 1000);
  cachedToken = { token, expiresAt };

  return token;
}

export async function getConnection() {
  const now = new Date();

  if (pool && cachedToken && cachedToken.expiresAt > now) {
    return pool;
  }

  try {
    if (pool) {
      await pool.end();
      pool = null;
    }

    const token = await getToken();

    pool = new Pool({
      host: process.env.DB_CLUSTER_ENDPOINT!,
      user: 'admin',
      password: token,
      database: 'postgres',
      port: 5432,
      ssl: true,
      max: 20,
    });
    return pool;
  } catch (error) {
    console.error('Failed to create database connection:', error);
    throw error;
  }
}

export async function closeConnection() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

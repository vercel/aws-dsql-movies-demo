import { AuroraDSQLPool } from '@aws/aurora-dsql-node-postgres-connector';
import { Pool } from 'pg';
import { config } from 'dotenv';

config();

let pool: Pool | null = null;

export async function getPool() {
  if (pool) {
    return pool;
  }

  try {
    pool = new AuroraDSQLPool({
      host: process.env.DB_CLUSTER_ENDPOINT!,
      region: process.env.AWS_REGION || 'us-east-1',
      user: 'admin',
      max: 20,
    });
    return pool;
  } catch (error) {
    console.error('Failed to create database connection pool:', error);
    throw error;
  }
}

export async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

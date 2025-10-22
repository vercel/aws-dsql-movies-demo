import type { Config } from 'drizzle-kit';

function getHostname() {
  const clusterId = process.env.DB_CLUSTER_ID;
  const region = process.env.AWS_REGION || 'us-east-1';

  if (!clusterId) {
    throw new Error('DB_CLUSTER_ID environment variable is required');
  }

  return `${clusterId}.dsql.${region}.on.aws`;
}

export default {
  schema: './lib/db/schema.ts',
  out: './lib/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    host: getHostname(),
    user: 'admin',
    password: process.env.DB_TOKEN!,
    database: 'postgres',
    port: 5432,
    ssl: true,
  },
} satisfies Config;

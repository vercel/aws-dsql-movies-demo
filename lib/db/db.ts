import { awsCredentialsProvider } from "@vercel/oidc-aws-credentials-provider";
import { attachDatabasePool } from "@vercel/functions";
import { DsqlSigner } from "@aws-sdk/dsql-signer";
import { ClientBase, Pool } from "pg";

// DSQL token max validity is 604,800 seconds (1 week). We are using 1 hour in this case.
const expiresInSeconds = 3600;

const signer = new DsqlSigner({
  hostname: process.env.PGHOST!,
  region: process.env.AWS_REGION!,
  expiresIn: expiresInSeconds,
  credentials: awsCredentialsProvider({
    roleArn: process.env.AWS_ROLE_ARN!,
    clientConfig: { region: process.env.AWS_REGION! },
  }),
});

const pool = new Pool({
  host: process.env.PGHOST!,
  database: process.env.PGDATABASE!,
  user: process.env.PGUSER || "admin",
  // The auth token value can be cached for up to 15 minutes (900 seconds) if desired.
  password: () => signer.getDbConnectAdminAuthToken(),
  port: Number(process.env.PGPORT!),
  ssl: true,
  max: 20,
});
attachDatabasePool(pool);

// Single query transaction.
export async function query(sql: string, args: unknown[]) {
  return pool.query(sql, args);
}

// Use it for multiple queries transaction.
export async function withConnection<T>(
  fn: (client: ClientBase) => Promise<T>,
): Promise<T> {
  const client = await pool.connect();
  try {
    return await fn(client);
  } finally {
    client.release();
  }
}

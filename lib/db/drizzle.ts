import { awsCredentialsProvider } from "@vercel/functions/oidc";
import { DsqlSigner } from "@aws-sdk/dsql-signer";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";
import { config } from "dotenv";

config();

const signer = new DsqlSigner({
  hostname: process.env.PGHOST!,
  region: process.env.AWS_REGION!,
  credentials: awsCredentialsProvider({
    roleArn: process.env.AWS_ROLE_ARN!,
    clientConfig: { region: process.env.AWS_REGION! },
  }),
});

const pool = new Pool({
  host: process.env.PGHOST!,
  user: process.env.PGUSER || "admin",
  password: () => signer.getDbConnectAdminAuthToken(),
  database: process.env.PGDATABASE || "postgres",
  port: Number(process.env.PGPORT) || 5432,
  ssl: true,
  max: 20,
});

const db = drizzle(pool, { schema });

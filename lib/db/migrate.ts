import dotenv from 'dotenv';
import path from 'path';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { closeConnection, getConnection } from './drizzle';

dotenv.config();

async function main() {
  const db = await getConnection();
  await migrate(db, {
    migrationsFolder: path.join(process.cwd(), '/lib/db/migrations'),
  });
  console.log(`Migrations complete`);
  await closeConnection();
}

main();

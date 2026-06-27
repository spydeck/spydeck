import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as bcrypt from 'bcrypt';
import * as schema from './schema';
import { users } from './schema';

async function main() {
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;
  const databaseUrl = process.env.DATABASE_URL;

  if (!username) throw new Error('ADMIN_USERNAME is required');
  if (!password) throw new Error('ADMIN_PASSWORD is required');
  if (!databaseUrl) throw new Error('DATABASE_URL is required');

  const pool = new Pool({ connectionString: databaseUrl });
  const db = drizzle(pool, { schema });

  const passwordHash = await bcrypt.hash(password, 10);

  // Seed the initial admin only. Don't clobber a password the user later changed
  // in-app (or via the planned first-run wizard) on every container restart.
  await db
    .insert(users)
    .values({ username, passwordHash })
    .onConflictDoNothing({ target: users.username });

  console.log(`Admin user "${username}" ensured.`);
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

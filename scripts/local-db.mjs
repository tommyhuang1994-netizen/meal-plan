// Local Postgres for development — `npm run db:local`.
//
// Runs a real Postgres server from a binary vendored into node_modules, so
// there is nothing to install system-wide (no Docker, no Homebrew). Data lives
// in ./.localdb and persists between runs.
//
// Alternative: point .env.local at a Neon `dev` branch instead and skip this
// entirely. This exists so the app can be worked on offline.
//
// Leave it running in its own terminal; Ctrl-C stops it.
import EmbeddedPostgres from 'embedded-postgres';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dataDir = join(root, '.localdb');
const PORT = 55432;

const pg = new EmbeddedPostgres({
  databaseDir: dataDir,
  user: 'postgres',
  password: 'postgres',
  port: PORT,
  persistent: true,
});

// initialise() shells out to initdb, which errors on a non-empty directory.
// PG_VERSION is written by initdb, so its presence means the cluster is
// already set up and we should go straight to starting it.
const alreadyInitialised = existsSync(join(dataDir, 'PG_VERSION'));
if (!alreadyInitialised) await pg.initialise();

await pg.start();

// mealplan_shadow is required by `prisma migrate dev`, which needs a throwaway
// database to diff migrations against. Both already exist on later runs.
if (!alreadyInitialised) {
  for (const db of ['mealplan', 'mealplan_shadow']) {
    try {
      await pg.createDatabase(db);
    } catch {
      // already exists
    }
  }
}

console.log(`
Postgres ready on port ${PORT}.

Put this in .env.local:

  DATABASE_URL="postgresql://postgres:postgres@localhost:${PORT}/mealplan?schema=public"
  DIRECT_URL="postgresql://postgres:postgres@localhost:${PORT}/mealplan?schema=public"
  SHADOW_DATABASE_URL="postgresql://postgres:postgres@localhost:${PORT}/mealplan_shadow?schema=public"

Then, in another terminal: npm run db:migrate && npm run db:seed
Ctrl-C to stop.
`);

async function shutdown() {
  await pg.stop();
  process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
setInterval(() => {}, 1 << 30);

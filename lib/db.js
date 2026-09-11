// Prisma client singleton.
//
// Prisma 7 has no built-in connector — it always goes through a driver adapter.
// PrismaPg speaks plain Postgres, so the same code path works against local
// Postgres and against Supabase's pooled endpoint.
//
// The client is created LAZILY, on first actual use. Creating it at module load
// meant a missing DATABASE_URL threw while Next was collecting page data, which
// failed the whole production build — including the pages that never touch the
// database. A missing variable should break the request that needs the
// database, with a message saying so, not the build.
//
// The global cache matters in dev: Next hot-reloads re-evaluate modules, and
// without it every reload opens a fresh pool until Postgres runs out of slots.
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const globalForPrisma = globalThis;

function createClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      'DATABASE_URL is not set. Locally: copy .env.example to .env.local. ' +
      'On Vercel: Settings -> Environment Variables, then redeploy.'
    );
  }
  return new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });
}

function client() {
  if (!globalForPrisma.__prisma) {
    const c = createClient();
    // Cache in production too: a serverless invocation reuses the module, and
    // a fresh pool per request would exhaust the connection limit.
    globalForPrisma.__prisma = c;
  }
  return globalForPrisma.__prisma;
}

/// Behaves like a PrismaClient, but nothing is constructed until a property is
/// actually read — so importing this module is always safe.
export const prisma = new Proxy(Object.create(null), {
  get(_target, prop) {
    const value = client()[prop];
    return typeof value === 'function' ? value.bind(client()) : value;
  },
  has(_target, prop) {
    return prop in client();
  },
});

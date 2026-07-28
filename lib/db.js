// Prisma client singleton.
//
// Prisma 7 has no built-in connector — it always goes through a driver adapter.
// PrismaPg speaks plain Postgres, so the same code path works against local
// Postgres and against Neon's pooled endpoint.
//
// The global cache matters in dev: Next hot-reloads re-evaluate modules, and
// without it every reload opens a fresh pool until Postgres runs out of slots.
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const globalForPrisma = globalThis;

function createClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set — copy .env.example to .env.local');
  }
  return new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

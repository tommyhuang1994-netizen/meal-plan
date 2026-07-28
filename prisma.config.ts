// Next.js reads .env.local automatically; the Prisma CLI does not, so load the
// same files here (dotenv does not let later files override earlier ones).
import { config } from "dotenv";
config({ path: [".env.local", ".env"], quiet: true });

import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    // Runs on `npx prisma db seed`.
    seed: "node prisma/seed.js",
  },
  datasource: {
    // The CLI must use a DIRECT connection — migrations cannot run through
    // pgBouncer. The app itself uses the pooled DATABASE_URL (see lib/db.js).
    // Locally the two are the same, so fall back.
    url: process.env["DIRECT_URL"] || process.env["DATABASE_URL"],
    // Usually unset: Prisma creates a temporary shadow database on the direct
    // connection. Set it only if your DB user cannot CREATE DATABASE.
    shadowDatabaseUrl: process.env["SHADOW_DATABASE_URL"],
  },
});

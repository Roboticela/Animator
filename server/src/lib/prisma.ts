import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";
import { Pool } from "pg";

const connectionString = process.env["DATABASE_URL"];
if (!connectionString) {
  throw new Error(
    "DATABASE_URL is missing. Add it to server/.env (never prefix secrets with VITE_).",
  );
}

const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClient;
  pgPool?: Pool;
};

const pool = globalForPrisma.pgPool ?? new Pool({ connectionString });
const adapter = new PrismaPg(pool);

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env["NODE_ENV"] !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.pgPool = pool;
}

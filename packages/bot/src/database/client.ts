import { PrismaClient } from './generated/index.js';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { SCHEMA_STATEMENTS } from './schema.js';

let prisma: PrismaClient;
let schemaEnsured = false;

export function getDatabase(): PrismaClient {
  if (!prisma) {
    const adapter = new PrismaBetterSqlite3({
      url: process.env.DATABASE_URL || 'file:./prisma/dev.db',
    });
    prisma = new PrismaClient({ adapter });
  }
  return prisma;
}

/**
 * Create any missing tables/indexes so the bot works against a fresh database
 * without a separate `prisma db push` step. Only ever adds objects (every
 * statement is IF NOT EXISTS), so it's safe to run on an already-migrated DB.
 * Call once during startup, before serving requests.
 */
export async function ensureSchema(): Promise<void> {
  if (schemaEnsured) {
    return;
  }
  const db = getDatabase();
  for (const statement of SCHEMA_STATEMENTS) {
    await db.$executeRawUnsafe(statement);
  }
  schemaEnsured = true;
}

export async function disconnectDatabase(): Promise<void> {
  if (prisma) {
    await prisma.$disconnect();
  }
}

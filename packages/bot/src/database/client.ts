import { PrismaClient } from './generated/index.js';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

let prisma: PrismaClient;

export function getDatabase(): PrismaClient {
  if (!prisma) {
    const adapter = new PrismaBetterSqlite3({
      url: process.env.DATABASE_URL || 'file:./prisma/dev.db',
    });
    prisma = new PrismaClient({ adapter });
  }
  return prisma;
}

export async function disconnectDatabase(): Promise<void> {
  if (prisma) {
    await prisma.$disconnect();
  }
}

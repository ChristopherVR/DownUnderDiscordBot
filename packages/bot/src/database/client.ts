import { PrismaClient } from './generated/index.js';

let prisma: PrismaClient;

export function getDatabase(): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient();
  }
  return prisma;
}

export async function disconnectDatabase(): Promise<void> {
  if (prisma) {
    await prisma.$disconnect();
  }
}

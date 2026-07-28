import { PrismaClient } from '@prisma/client';

let prisma: PrismaClient;

function getPrismaClient(): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development'
        ? ['query', 'info', 'warn', 'error']
        : ['warn', 'error'],
    });
  }
  return prisma;
}

export const db = {
  connect: async (): Promise<void> => {
    const client = getPrismaClient();
    await client.$connect();
  },
  getClient: (): PrismaClient => {
    return getPrismaClient();
  },
  disconnect: async (): Promise<void> => {
    const client = getPrismaClient();
    await client.$disconnect();
  },
};

export type TransactionClient = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;
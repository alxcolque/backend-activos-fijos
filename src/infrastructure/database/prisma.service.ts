import { PrismaClient } from '@prisma/client';
import { logger } from '../logger/logger';

export class PrismaService extends PrismaClient {
  private static instance: PrismaService;

  private constructor() {
    super();
  }

  public static getInstance(): PrismaService {
    if (!PrismaService.instance) {
      PrismaService.instance = new PrismaService();
    }
    return PrismaService.instance;
  }

  public async connect(): Promise<void> {
    try {
      await this.$connect();
      logger.info('Database connection established successfully');
    } catch (error) {
      logger.error({ error }, 'Failed to connect to database');
    }
  }

  public async disconnect(): Promise<void> {
    await this.$disconnect();
    logger.info('Database connection closed');
  }
}

export const prisma = PrismaService.getInstance();

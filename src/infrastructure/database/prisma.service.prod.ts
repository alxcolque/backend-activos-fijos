/**
 * prisma.service.prod.ts
 * Stub de producción — reemplaza prisma.service.ts durante el build de producción.
 * NO importa @prisma/client. Expone la misma interfaz (connect/disconnect)
 * para que server.ts compile sin cambios.
 */
import { logger } from '../logger/logger';

export class PrismaService {
  private static instance: PrismaService;

  private constructor() {}

  public static getInstance(): PrismaService {
    if (!PrismaService.instance) {
      PrismaService.instance = new PrismaService();
    }
    return PrismaService.instance;
  }

  public async connect(): Promise<void> {
    logger.info('📦 Modo Producción: Base de datos mediante mysql2 (Prisma no activo)');
  }

  public async disconnect(): Promise<void> {
    logger.info('📦 Modo Producción: Desconexión mysql2 (Prisma no activo)');
  }
}

export const prisma = PrismaService.getInstance();

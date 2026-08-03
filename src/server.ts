import { buildApp } from './app';
import { env } from './infrastructure/config/env';
import { logger } from './infrastructure/logger/logger';
import { prisma } from './infrastructure/database/prisma.service';

async function startServer() {
  try {
    const app = await buildApp();

    // Conectar a la base de datos (si la DB está disponible)
    await prisma.connect();

    await app.listen({
      port: env.PORT,
      host: '0.0.0.0',
    });

    logger.info(`🚀 Servidor ejecutándose en http://localhost:${env.PORT}`);
    logger.info(`📚 Documentación Swagger disponible en http://localhost:${env.PORT}/docs`);
    logger.info(`❤️ Health Check disponible en http://localhost:${env.PORT}/api/v1/health`);
  } catch (error) {
    logger.error({ error }, 'Error al iniciar el servidor');
    process.exit(1);
  }
}

startServer();

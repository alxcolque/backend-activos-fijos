import { buildApp } from './app';
import { env } from './infrastructure/config/env';
import { logger } from './infrastructure/logger/logger';
import { prisma } from './infrastructure/database/prisma.service';

async function startServer() {
  try {
    const app = await buildApp();

    // Conectar a la base de datos (si la DB está disponible)
    await prisma.connect();

    const rawPort = process.env.PORT || env.PORT;
    const isSocket = isNaN(Number(rawPort));

    if (isSocket) {
      await app.listen({ path: rawPort });
      logger.info(`🚀 Servidor ejecutándose en Socket Passenger: ${rawPort}`);
    } else {
      const portNum = Number(rawPort);
      await app.listen({
        port: portNum,
        host: '0.0.0.0',
      });
      logger.info(`🚀 Servidor ejecutándose en puerto: ${portNum}`);
    }

    logger.info(`📚 Documentación Swagger disponible en /docs`);
    logger.info(`❤️ Health Check disponible en /api/v1/health`);
  } catch (error) {
    logger.error({ error }, 'Error al iniciar el servidor');
    process.exit(1);
  }
}

startServer();

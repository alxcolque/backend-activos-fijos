import { FastifyInstance } from 'fastify';
import fastifyCors from '@fastify/cors';
import { env } from '../infrastructure/config/env';

export async function registerCors(fastify: FastifyInstance) {
  await fastify.register(fastifyCors, {
    origin: (origin, cb) => {
      // Permitir peticiones sin origen (ej. Postman, curl, server-to-server) o localhost en cualquier puerto
      if (!origin || /^http:\/\/localhost:\d+$/.test(origin) || origin === env.CORS_ORIGIN) {
        cb(null, true);
        return;
      }
      cb(new Error('No permitido por CORS'), false);
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });
}

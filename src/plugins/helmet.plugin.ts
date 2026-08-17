import { FastifyInstance } from 'fastify';
import fastifyHelmet from '@fastify/helmet';

export async function registerHelmet(fastify: FastifyInstance) {
  await fastify.register(fastifyHelmet, {
    contentSecurityPolicy: false, // Deshabilitado para Swagger UI
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // Permitir cargar imágenes estáticas desde el frontend en otro puerto/origen
  });
}

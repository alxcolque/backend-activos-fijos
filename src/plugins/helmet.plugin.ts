import { FastifyInstance } from 'fastify';
import fastifyHelmet from '@fastify/helmet';

export async function registerHelmet(fastify: FastifyInstance) {
  await fastify.register(fastifyHelmet, {
    contentSecurityPolicy: false, // Disabilitado para Swagger UI
  });
}

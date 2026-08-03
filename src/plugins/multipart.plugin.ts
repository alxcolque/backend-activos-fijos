import { FastifyInstance } from 'fastify';
import fastifyMultipart from '@fastify/multipart';
import { env } from '../infrastructure/config/env';

export async function registerMultipart(fastify: FastifyInstance) {
  await fastify.register(fastifyMultipart, {
    limits: {
      fileSize: env.MAX_UPLOAD_SIZE,
    },
  });
}

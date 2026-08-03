import { FastifyInstance } from 'fastify';
import fastifyStatic from '@fastify/static';
import path from 'path';

export async function registerStatic(fastify: FastifyInstance) {
  const uploadsPath = path.join(process.cwd(), 'uploads');

  await fastify.register(fastifyStatic, {
    root: uploadsPath,
    prefix: '/uploads/',
  });
}

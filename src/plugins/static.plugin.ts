import { FastifyInstance } from 'fastify';
import fastifyStatic from '@fastify/static';
import path from 'path';

import fs from 'fs';

export async function registerStatic(fastify: FastifyInstance) {
  const uploadsPath = path.join(process.cwd(), 'uploads');

  if (!fs.existsSync(uploadsPath)) {
    fs.mkdirSync(uploadsPath, { recursive: true });
  }

  await fastify.register(fastifyStatic, {
    root: uploadsPath,
    prefix: '/uploads/',
    decorateReply: false,
    setHeaders: (res) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    },
  });
}

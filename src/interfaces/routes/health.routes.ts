import { FastifyInstance } from 'fastify';
import { HealthController } from '../controllers/health.controller';

export async function healthRoutes(fastify: FastifyInstance) {
  fastify.get(
    '/health',
    {
      schema: {
        description: 'Endpoint de verificación del estado del servidor (Health Check)',
        tags: ['Health'],
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              status: { type: 'string' },
              version: { type: 'string' },
            },
          },
        },
      },
    },
    HealthController.getHealth,
  );
}

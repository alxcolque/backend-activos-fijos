import { FastifyInstance } from 'fastify';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';

export async function registerSwagger(fastify: FastifyInstance) {
  const enableSwagger = process.env.ENABLE_SWAGGER !== 'false';

  if (!enableSwagger) {
    return;
  }

  await fastify.register(fastifySwagger, {
    openapi: {
      info: {
        title: 'Sistema de Gestión de Activos Fijos COMIBOL API',
        description: 'API REST para la administración de activos fijos institucionales.',
        version: '1.0.0',
      },
      servers: [
        {
          url: 'http://localhost:3000',
          description: 'Servidor Local de Desarrollo',
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
    },
  });

  await fastify.register(fastifySwaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: false,
    },
    staticCSP: true,
  });
}

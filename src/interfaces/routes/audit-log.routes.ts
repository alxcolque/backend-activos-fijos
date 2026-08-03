import { FastifyInstance } from 'fastify';
import { AuditLogController } from '../controllers/audit-log.controller';
import { authenticate } from '../middlewares/auth.middleware';

export async function auditLogRoutes(fastify: FastifyInstance) {
  // Obtener logs de auditoría HTTP
  fastify.get(
    '/',
    {
      onRequest: [authenticate],
      schema: {
        description: 'Obtener la bitácora de auditoría de peticiones HTTP de mutación',
        tags: ['Registro de Auditoría'],
        security: [{ bearerAuth: [] }],
        querystring: {
          type: 'object',
          properties: {
            page: { type: 'number', default: 1 },
            limit: { type: 'number', default: 20 },
            method: { type: 'string', description: 'Método HTTP (POST, PUT, PATCH, DELETE)' },
            statusCode: { type: 'number', description: 'Código de respuesta HTTP' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: true },
              message: { type: 'string' },
              data: { type: 'array', items: { type: 'object' } },
              pagination: { type: 'object' },
            },
          },
        },
      },
    },
    AuditLogController.getLogs,
  );

  // Obtener estadísticas de auditoría HTTP
  fastify.get(
    '/stats',
    {
      onRequest: [authenticate],
      schema: {
        description: 'Obtener estadísticas consolidadas de auditoría de peticiones HTTP',
        tags: ['Registro de Auditoría'],
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: true },
              data: {
                type: 'object',
                properties: {
                  totalRequests: { type: 'number' },
                  successfulMutations: { type: 'number' },
                  failedMutations: { type: 'number' },
                  avgResponseTimeMs: { type: 'number' },
                },
              },
            },
          },
        },
      },
    },
    AuditLogController.getStats,
  );
}

import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import { AuditLogRepository } from '../infrastructure/repositories/audit-log.repository';

const repository = new AuditLogRepository();

export const registerAuditLogPlugin = fp(async (fastify: FastifyInstance) => {
  fastify.addHook('onRequest', async (request) => {
    (request as any).startTime = Date.now();
  });

  fastify.addHook('onResponse', async (request, reply) => {
    const method = request.method;
    // Log mutation methods (POST, PUT, PATCH, DELETE)
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      const startTime = (request as any).startTime || Date.now();
      const responseTimeMs = Date.now() - startTime;

      await repository.recordLog({
        timestamp: new Date(),
        method,
        url: request.url,
        statusCode: reply.statusCode,
        responseTimeMs,
        ip: request.ip || '127.0.0.1',
        userAgent: request.headers['user-agent'],
        userId: request.user?.id,
      });
    }
  });
});

import { FastifyReply, FastifyRequest } from 'fastify';

export class HealthController {
  public static async getHealth(_request: FastifyRequest, reply: FastifyReply) {
    return reply.status(200).send({
      success: true,
      status: 'ok',
      version: '1.0.0',
    });
  }
}

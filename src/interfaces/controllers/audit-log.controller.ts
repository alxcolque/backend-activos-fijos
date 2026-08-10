import { FastifyRequest, FastifyReply } from 'fastify';
import { RepositoryFactory } from '../../infrastructure/database/repository.factory';
import { GetAuditLogsUseCase } from '../../application/audit-logs/get-audit-logs/get-audit-logs.usecase';
import { GetAuditStatsUseCase } from '../../application/audit-logs/get-audit-stats/get-audit-stats.usecase';
import { queryAuditLogSchema } from '../validators/audit-logs/audit-log.validator';
import { successResponse } from '../../shared/utils/response.util';

const repository = RepositoryFactory.getAuditLogRepository();
const getAuditLogsUseCase = new GetAuditLogsUseCase(repository);
const getAuditStatsUseCase = new GetAuditStatsUseCase(repository);

export class AuditLogController {
  public static async getLogs(request: FastifyRequest, reply: FastifyReply) {
    const validatedQuery = queryAuditLogSchema.parse(request.query);
    const result = await getAuditLogsUseCase.execute(validatedQuery);
    return reply.status(200).send({
      success: true,
      message: 'Logs de auditoría HTTP obtenidos correctamente.',
      data: result.data,
      pagination: result.pagination,
    });
  }

  public static async getStats(_request: FastifyRequest, reply: FastifyReply) {
    const stats = await getAuditStatsUseCase.execute();
    return reply.status(200).send(successResponse(stats));
  }
}

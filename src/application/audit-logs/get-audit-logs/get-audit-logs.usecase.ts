import {
  IAuditLogRepository,
  FindAllAuditLogsOptions,
} from '../../../domain/audit-logs/audit-log.repository.interface';
import { logger } from '../../../infrastructure/logger/logger';

export class GetAuditLogsUseCase {
  constructor(private auditLogRepository: IAuditLogRepository) {}

  async execute(options: FindAllAuditLogsOptions) {
    logger.info({ options }, 'Consulta de logs de auditoría HTTP');
    const result = await this.auditLogRepository.getLogs(options);
    const limit = options.limit || 20;
    const page = options.page || 1;

    return {
      data: result.data,
      pagination: {
        total: result.total,
        page,
        limit,
        totalPages: Math.ceil(result.total / limit) || 1,
      },
    };
  }
}

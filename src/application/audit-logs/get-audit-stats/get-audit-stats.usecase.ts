import { IAuditLogRepository } from '../../../domain/audit-logs/audit-log.repository.interface';
import { logger } from '../../../infrastructure/logger/logger';

export class GetAuditStatsUseCase {
  constructor(private auditLogRepository: IAuditLogRepository) {}

  async execute() {
    logger.info('Consulta de estadísticas de auditoría HTTP');
    return this.auditLogRepository.getStats();
  }
}

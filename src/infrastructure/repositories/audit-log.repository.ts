import {
  IAuditLogRepository,
  HttpAuditItem,
  FindAllAuditLogsOptions,
  AuditStatsResult,
} from '../../domain/audit-logs/audit-log.repository.interface';
import { logger } from '../logger/logger';

const memoryAuditLogs: HttpAuditItem[] = [];
const MAX_LOGS = 1000;

export class AuditLogRepository implements IAuditLogRepository {
  async recordLog(item: HttpAuditItem): Promise<void> {
    memoryAuditLogs.unshift(item);
    if (memoryAuditLogs.length > MAX_LOGS) {
      memoryAuditLogs.pop();
    }
    logger.info({ audit: item }, 'Auditoría HTTP registrada');
  }

  async getLogs(
    options: FindAllAuditLogsOptions,
  ): Promise<{ data: HttpAuditItem[]; total: number }> {
    let filtered = [...memoryAuditLogs];

    if (options.method) {
      filtered = filtered.filter((l) => l.method.toUpperCase() === options.method?.toUpperCase());
    }

    if (options.statusCode) {
      filtered = filtered.filter((l) => l.statusCode === options.statusCode);
    }

    const total = filtered.length;
    const page = options.page && options.page > 0 ? options.page : 1;
    const limit = options.limit && options.limit > 0 ? options.limit : 20;
    const skip = (page - 1) * limit;
    const data = filtered.slice(skip, skip + limit);

    return { data, total };
  }

  async getStats(): Promise<AuditStatsResult> {
    const totalRequests = memoryAuditLogs.length;
    const successfulMutations = memoryAuditLogs.filter(
      (l) => l.statusCode >= 200 && l.statusCode < 300,
    ).length;
    const failedMutations = memoryAuditLogs.filter((l) => l.statusCode >= 400).length;

    const totalTime = memoryAuditLogs.reduce((acc, curr) => acc + curr.responseTimeMs, 0);
    const avgResponseTimeMs =
      totalRequests > 0 ? Math.round((totalTime / totalRequests) * 100) / 100 : 0;

    return {
      totalRequests,
      successfulMutations,
      failedMutations,
      avgResponseTimeMs,
    };
  }
}

export interface HttpAuditItem {
  timestamp: Date;
  method: string;
  url: string;
  statusCode: number;
  responseTimeMs: number;
  ip: string;
  userAgent?: string;
  userId?: string;
}

export interface FindAllAuditLogsOptions {
  page?: number;
  limit?: number;
  method?: string;
  statusCode?: number;
}

export interface AuditStatsResult {
  totalRequests: number;
  successfulMutations: number;
  failedMutations: number;
  avgResponseTimeMs: number;
}

export interface IAuditLogRepository {
  recordLog(item: HttpAuditItem): Promise<void>;
  getLogs(options: FindAllAuditLogsOptions): Promise<{ data: HttpAuditItem[]; total: number }>;
  getStats(): Promise<AuditStatsResult>;
}

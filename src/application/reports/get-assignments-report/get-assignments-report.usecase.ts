import {
  IReportRepository,
  ReportFilterOptions,
} from '../../../domain/reports/report.repository.interface';
import { logger } from '../../../infrastructure/logger/logger';

export class GetAssignmentsReportUseCase {
  constructor(private reportRepository: IReportRepository) {}

  async execute(options: ReportFilterOptions) {
    logger.info({ options }, 'Generación de reporte de asignaciones');
    return this.reportRepository.getAssignmentsReport(options);
  }
}

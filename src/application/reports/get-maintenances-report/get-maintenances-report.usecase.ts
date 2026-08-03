import {
  IReportRepository,
  ReportFilterOptions,
} from '../../../domain/reports/report.repository.interface';
import { logger } from '../../../infrastructure/logger/logger';

export class GetMaintenancesReportUseCase {
  constructor(private reportRepository: IReportRepository) {}

  async execute(options: ReportFilterOptions) {
    logger.info({ options }, 'Generación de reporte de mantenimientos');
    return this.reportRepository.getMaintenancesReport(options);
  }
}

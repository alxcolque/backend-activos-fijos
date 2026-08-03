import {
  IReportRepository,
  ReportFilterOptions,
} from '../../../domain/reports/report.repository.interface';
import { logger } from '../../../infrastructure/logger/logger';

export class GetAssetsReportUseCase {
  constructor(private reportRepository: IReportRepository) {}

  async execute(options: ReportFilterOptions) {
    logger.info({ options }, 'Generación de reporte de activos fijos');
    return this.reportRepository.getAssetsReport(options);
  }
}

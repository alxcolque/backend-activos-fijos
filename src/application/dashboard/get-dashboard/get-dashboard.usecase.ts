import { IDashboardRepository } from '../../../domain/dashboard/dashboard.repository.interface';
import { logger } from '../../../infrastructure/logger/logger';

export class GetDashboardUseCase {
  constructor(private dashboardRepository: IDashboardRepository) {}

  async execute() {
    logger.info('Generando reporte sintético del Dashboard');
    const dashboardData = await this.dashboardRepository.getDashboardData();
    return dashboardData;
  }
}

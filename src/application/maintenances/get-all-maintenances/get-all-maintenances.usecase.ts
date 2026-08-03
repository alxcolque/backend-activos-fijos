import {
  IMaintenanceRepository,
  FindAllMaintenancesOptions,
} from '../../../domain/maintenances/maintenance.repository.interface';
import { logger } from '../../../infrastructure/logger/logger';

export class GetAllMaintenancesUseCase {
  constructor(private maintenanceRepository: IMaintenanceRepository) {}

  async execute(options: FindAllMaintenancesOptions) {
    logger.info({ options }, 'Consulta general de mantenimientos');
    return this.maintenanceRepository.findAll(options);
  }
}

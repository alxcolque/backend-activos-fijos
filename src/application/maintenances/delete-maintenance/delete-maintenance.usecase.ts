import { IMaintenanceRepository } from '../../../domain/maintenances/maintenance.repository.interface';
import { NotFoundError } from '../../../shared/errors/app-error';
import { logger } from '../../../infrastructure/logger/logger';
import { logAssetHistory } from '../../../shared/utils/audit.util';

export class DeleteMaintenanceUseCase {
  constructor(private maintenanceRepository: IMaintenanceRepository) {}

  async execute(id: string, userId?: string) {
    const current = await this.maintenanceRepository.findById(id);

    if (!current) {
      throw new NotFoundError('Registro de mantenimiento no encontrado.');
    }

    await this.maintenanceRepository.delete(id);

    logger.info({ maintenanceId: id }, 'Mantenimiento eliminado exitosamente');
    await logAssetHistory(
      current.assetId,
      userId,
      'MAINTENANCE_REMOVE',
      'Registro de mantenimiento eliminado',
    );

    return {
      message: 'Mantenimiento eliminado correctamente.',
    };
  }
}

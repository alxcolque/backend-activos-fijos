import { IMaintenanceRepository } from '../../../domain/maintenances/maintenance.repository.interface';
import { UpdateMaintenanceInput } from '../../../interfaces/validators/maintenances/maintenance.validator';
import { AppError, NotFoundError } from '../../../shared/errors/app-error';
import { logger } from '../../../infrastructure/logger/logger';
import { logAssetHistory } from '../../../shared/utils/audit.util';

export class UpdateMaintenanceUseCase {
  constructor(private maintenanceRepository: IMaintenanceRepository) {}

  async execute(id: string, input: UpdateMaintenanceInput, userId?: string) {
    const current = await this.maintenanceRepository.findById(id);

    if (!current) {
      throw new NotFoundError('Registro de mantenimiento no encontrado.');
    }

    const maintenanceDate = input.maintenanceDate
      ? new Date(input.maintenanceDate)
      : current.maintenanceDate;

    const nextMaintenance =
      input.nextMaintenance !== undefined
        ? input.nextMaintenance
          ? new Date(input.nextMaintenance)
          : null
        : current.nextMaintenance;

    if (nextMaintenance && nextMaintenance < maintenanceDate) {
      throw new AppError(
        'La fecha del próximo mantenimiento no puede ser anterior a la fecha de mantenimiento.',
        400,
      );
    }

    const updated = await this.maintenanceRepository.update(id, {
      ...input,
      maintenanceDate,
      nextMaintenance,
    });

    logger.info({ maintenanceId: id }, 'Mantenimiento actualizado exitosamente');
    await logAssetHistory(
      current.assetId,
      userId,
      'MAINTENANCE_UPDATE',
      'Registro de mantenimiento actualizado',
    );

    return updated;
  }
}

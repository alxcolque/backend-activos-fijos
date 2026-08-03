import { IMaintenanceRepository } from '../../../domain/maintenances/maintenance.repository.interface';
import { CreateMaintenanceInput } from '../../../interfaces/validators/maintenances/maintenance.validator';
import { AppError, NotFoundError } from '../../../shared/errors/app-error';
import { logger } from '../../../infrastructure/logger/logger';
import { logAssetHistory } from '../../../shared/utils/audit.util';

export class CreateMaintenanceUseCase {
  constructor(private maintenanceRepository: IMaintenanceRepository) {}

  async execute(input: CreateMaintenanceInput, userId?: string) {
    const assetExists = await this.maintenanceRepository.existsAsset(input.assetId);
    if (!assetExists) {
      throw new NotFoundError('Activo no encontrado.');
    }

    const maintenanceDate = new Date(input.maintenanceDate);
    const nextMaintenance = input.nextMaintenance ? new Date(input.nextMaintenance) : null;

    if (nextMaintenance && nextMaintenance < maintenanceDate) {
      throw new AppError(
        'La fecha del próximo mantenimiento no puede ser anterior a la fecha de mantenimiento.',
        400,
      );
    }

    const maintenance = await this.maintenanceRepository.create({
      assetId: input.assetId,
      type: input.type,
      maintenanceDate,
      provider: input.provider,
      cost: input.cost,
      nextMaintenance,
      observations: input.observations,
    });

    logger.info(
      { maintenanceId: maintenance.id, assetId: input.assetId },
      'Mantenimiento registrado exitosamente',
    );
    await logAssetHistory(
      input.assetId,
      userId,
      'MAINTENANCE_ADD',
      `Mantenimiento ${input.type} registrado (Costo: BS. ${input.cost || 0})`,
    );

    return maintenance;
  }
}

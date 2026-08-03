import { MaintenanceType } from '@prisma/client';
import { IMaintenanceRepository } from '../../../domain/maintenances/maintenance.repository.interface';
import { NotFoundError } from '../../../shared/errors/app-error';

export class GetAssetMaintenancesUseCase {
  constructor(private maintenanceRepository: IMaintenanceRepository) {}

  async execute(assetId: string, type?: MaintenanceType) {
    const assetExists = await this.maintenanceRepository.existsAsset(assetId);
    if (!assetExists) {
      throw new NotFoundError('Activo no encontrado.');
    }

    return this.maintenanceRepository.findByAssetId(assetId, type);
  }
}

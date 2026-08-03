import { IAssetRepository } from '../../../domain/assets/asset.repository.interface';
import { AppError, NotFoundError } from '../../../shared/errors/app-error';
import { logger } from '../../../infrastructure/logger/logger';
import { logAssetHistory } from '../../../shared/utils/audit.util';

export class DeleteAssetUseCase {
  constructor(private assetRepository: IAssetRepository) {}

  async execute(id: string, userId?: string) {
    const asset = await this.assetRepository.findRawById(id);

    if (!asset) {
      throw new NotFoundError('Activo no encontrado.');
    }

    const hasRelated = await this.assetRepository.hasRelatedData(id);

    if (hasRelated) {
      throw new AppError('No es posible eliminar el activo porque tiene información relacionada.', 400);
    }

    await this.assetRepository.delete(id);
    logger.info({ assetId: id }, 'Activo eliminado exitosamente (Soft Delete)');
    await logAssetHistory(id, userId, 'DELETE', 'Activo eliminado (Soft Delete)');

    return {
      message: 'Activo eliminado correctamente.',
    };
  }
}

import { IAssetRepository } from '../../../domain/assets/asset.repository.interface';
import { NotFoundError } from '../../../shared/errors/app-error';
import { logger } from '../../../infrastructure/logger/logger';

export class GetAssetUseCase {
  constructor(private assetRepository: IAssetRepository) {}

  async execute(id: string) {
    const asset = await this.assetRepository.findById(id);

    if (!asset) {
      throw new NotFoundError('Activo no encontrado.');
    }

    logger.info({ assetId: id }, 'Consulta de activo');
    return asset;
  }
}

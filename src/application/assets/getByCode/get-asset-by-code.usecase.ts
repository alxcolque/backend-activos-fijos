import { IAssetRepository } from '../../../domain/assets/asset.repository.interface';
import { NotFoundError } from '../../../shared/errors/app-error';
import { logger } from '../../../infrastructure/logger/logger';

export class GetAssetByCodeUseCase {
  constructor(private assetRepository: IAssetRepository) {}

  async execute(code: string) {
    const asset = await this.assetRepository.findByCode(code);

    if (!asset) {
      throw new NotFoundError('Activo no encontrado.');
    }

    logger.info({ code }, 'Consulta de activo por código');
    return asset;
  }
}

import {
  IAssetRepository,
  FindAllAssetsOptions,
} from '../../../domain/assets/asset.repository.interface';
import { logger } from '../../../infrastructure/logger/logger';

export class GetAssetsUseCase {
  constructor(private assetRepository: IAssetRepository) {}

  async execute(options: FindAllAssetsOptions) {
    logger.info({ options }, 'Consulta de listado de activos fijos');
    return this.assetRepository.findAll(options);
  }
}

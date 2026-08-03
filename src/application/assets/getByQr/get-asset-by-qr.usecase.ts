import { IAssetRepository } from '../../../domain/assets/asset.repository.interface';
import { NotFoundError } from '../../../shared/errors/app-error';
import { logger } from '../../../infrastructure/logger/logger';

export class GetAssetByQrUseCase {
  constructor(private assetRepository: IAssetRepository) {}

  async execute(qrCode: string) {
    const asset = await this.assetRepository.findByQr(qrCode);

    if (!asset) {
      throw new NotFoundError('Activo no encontrado mediante código QR.');
    }

    logger.info({ qrCode }, 'Consulta de activo por QR');
    return asset;
  }
}

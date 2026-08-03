import { IAssetProjectRepository } from '../../../domain/asset-projects/asset-project.repository.interface';
import { NotFoundError } from '../../../shared/errors/app-error';

export class GetAssetProjectsHistoryUseCase {
  constructor(private assetProjectRepository: IAssetProjectRepository) {}

  async execute(assetId: string) {
    const assetExists = await this.assetProjectRepository.existsAsset(assetId);
    if (!assetExists) {
      throw new NotFoundError('Activo no encontrado.');
    }

    return this.assetProjectRepository.findByAssetId(assetId);
  }
}

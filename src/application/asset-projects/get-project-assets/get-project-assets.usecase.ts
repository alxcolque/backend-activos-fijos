import { IAssetProjectRepository } from '../../../domain/asset-projects/asset-project.repository.interface';
import { NotFoundError } from '../../../shared/errors/app-error';

export class GetProjectAssetsUseCase {
  constructor(private assetProjectRepository: IAssetProjectRepository) {}

  async execute(projectId: string, activeOnly = false) {
    const projectInfo = await this.assetProjectRepository.findProjectStatus(projectId);
    if (!projectInfo.exists) {
      throw new NotFoundError('Proyecto no encontrado.');
    }

    return this.assetProjectRepository.findByProjectId(projectId, activeOnly);
  }
}

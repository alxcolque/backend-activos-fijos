import {
  IAssetProjectRepository,
  FindAllAssetProjectsOptions,
} from '../../../domain/asset-projects/asset-project.repository.interface';
import { logger } from '../../../infrastructure/logger/logger';

export class GetAllAssignmentsUseCase {
  constructor(private assetProjectRepository: IAssetProjectRepository) {}

  async execute(options: FindAllAssetProjectsOptions) {
    logger.info({ options }, 'Consulta de asignaciones activo-proyecto');
    return this.assetProjectRepository.findAll(options);
  }
}

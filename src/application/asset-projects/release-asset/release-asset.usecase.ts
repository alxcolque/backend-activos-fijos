import { IAssetProjectRepository } from '../../../domain/asset-projects/asset-project.repository.interface';
import { ReleaseAssetInput } from '../../../interfaces/validators/asset-projects/asset-project.validator';
import { AppError, NotFoundError } from '../../../shared/errors/app-error';
import { logger } from '../../../infrastructure/logger/logger';
import { logAssetHistory } from '../../../shared/utils/audit.util';

export class ReleaseAssetUseCase {
  constructor(private assetProjectRepository: IAssetProjectRepository) {}

  async execute(input: ReleaseAssetInput, userId?: string) {
    const activeAssignment = await this.assetProjectRepository.findActiveAssignment(
      input.assetId,
      input.projectId,
    );

    if (!activeAssignment) {
      throw new AppError('No existe una asignación activa entre el activo y el proyecto especificado.', 400);
    }

    const released = await this.assetProjectRepository.release(activeAssignment.id, input.observations);

    logger.info(
      { assetId: input.assetId, projectId: input.projectId },
      'Activo liberado del proyecto',
    );

    await logAssetHistory(
      input.assetId,
      userId,
      'PROJECT_RELEASE',
      `Liberado del proyecto`,
    );

    return released;
  }
}

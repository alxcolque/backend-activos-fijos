import { IAssetProjectRepository } from '../../../domain/asset-projects/asset-project.repository.interface';
import { ReleaseAssetInput } from '../../../interfaces/validators/asset-projects/asset-project.validator';
import { AppError, NotFoundError } from '../../../shared/errors/app-error';
import { logger } from '../../../infrastructure/logger/logger';
import { logAssetHistory } from '../../../shared/utils/audit.util';

export class ReleaseAssetUseCase {
  constructor(private assetProjectRepository: IAssetProjectRepository) {}

  async execute(input: ReleaseAssetInput, userId?: string) {
    let targetId = input.assignmentId;
    let targetAssetId = input.assetId;

    if (!targetId) {
      if (!input.assetId || !input.projectId) {
        throw new AppError('Debe especificar la asignación o el activo y proyecto a liberar.', 400);
      }
      const activeAssignment = await this.assetProjectRepository.findActiveAssignment(
        input.assetId,
        input.projectId,
      );

      if (!activeAssignment) {
        throw new AppError('No existe una asignación activa entre el activo y el proyecto especificado.', 400);
      }

      targetId = activeAssignment.id;
      targetAssetId = activeAssignment.assetId;
    } else {
      const assignment = await this.assetProjectRepository.findById(targetId);
      if (!assignment) {
        throw new NotFoundError('La asignación no existe o fue eliminada.');
      }
      targetAssetId = assignment.assetId;
    }

    const released = await this.assetProjectRepository.release(
      targetId,
      input.observations,
      input.quantityToRelease,
    );

    logger.info({ id: targetId, assetId: targetAssetId }, 'Activo liberado del proyecto');

    if (targetAssetId) {
      await logAssetHistory(
        targetAssetId,
        userId,
        'PROJECT_RELEASE',
        `Liberado del proyecto`,
      );
    }

    return released;
  }
}

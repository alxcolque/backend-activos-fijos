import { IAssetProjectRepository } from '../../../domain/asset-projects/asset-project.repository.interface';
import { NotFoundError } from '../../../shared/errors/app-error';
import { logger } from '../../../infrastructure/logger/logger';
import { logAssetHistory } from '../../../shared/utils/audit.util';

export class DeleteAssignmentUseCase {
  constructor(private assetProjectRepository: IAssetProjectRepository) {}

  async execute(id: string, userId?: string): Promise<boolean> {
    const assignment = await this.assetProjectRepository.findById(id);
    if (!assignment) {
      throw new NotFoundError('La asignación no existe o ya fue eliminada.');
    }

    const success = await this.assetProjectRepository.deleteAssignment(id);

    if (success) {
      logger.info({ id, assetId: assignment.assetId, projectId: assignment.projectId }, 'Asignación eliminada');
      await logAssetHistory(
        assignment.assetId,
        userId,
        'PROJECT_UNASSIGN',
        `Asignación al proyecto eliminada`,
      );
    }

    return success;
  }
}

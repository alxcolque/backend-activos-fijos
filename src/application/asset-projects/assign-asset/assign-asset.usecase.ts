import { IAssetProjectRepository } from '../../../domain/asset-projects/asset-project.repository.interface';
import { AssignAssetInput } from '../../../interfaces/validators/asset-projects/asset-project.validator';
import { AppError, NotFoundError } from '../../../shared/errors/app-error';
import { logger } from '../../../infrastructure/logger/logger';
import { logAssetHistory } from '../../../shared/utils/audit.util';

export class AssignAssetUseCase {
  constructor(private assetProjectRepository: IAssetProjectRepository) {}

  async execute(input: AssignAssetInput, userId?: string) {
    const assetExists = await this.assetProjectRepository.existsAsset(input.assetId);
    if (!assetExists) {
      throw new NotFoundError('Activo no encontrado.');
    }

    const projectInfo = await this.assetProjectRepository.findProjectStatus(input.projectId);
    if (!projectInfo.exists) {
      throw new NotFoundError('Proyecto no encontrado.');
    }

    if (projectInfo.status !== 'ACTIVE') {
      throw new AppError('Solo se pueden asignar activos a proyectos en estado ACTIVO.', 400);
    }

    const activeAssignment = await this.assetProjectRepository.findActiveAssignmentByAssetId(input.assetId);
    if (activeAssignment) {
      throw new AppError('El activo ya se encuentra asignado a un proyecto activo.', 400);
    }

    const assignment = await this.assetProjectRepository.assign(input);

    logger.info({ assetId: input.assetId, projectId: input.projectId }, 'Activo asignado a proyecto');
    await logAssetHistory(
      input.assetId,
      userId,
      'PROJECT_ASSIGN',
      `Asignado al proyecto '${projectInfo.name}'`,
    );

    return assignment;
  }
}

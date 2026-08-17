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

    const stock = await this.assetProjectRepository.getAssetStock(input.assetId);
    if (!stock.exists) {
      throw new NotFoundError('Activo no encontrado.');
    }

    const requestedQty = input.quantity && input.quantity > 0 ? input.quantity : 1;
    if (stock.available! <= 0) {
      throw new AppError(`El activo "${stock.name}" (${stock.code}) no tiene unidades disponibles en almacén.`, 400);
    }

    if (requestedQty > stock.available!) {
      throw new AppError(
        `No existen suficientes unidades disponibles para "${stock.name}" (${stock.code}). Disponible: ${stock.available}, solicitado: ${requestedQty}.`,
        400,
      );
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

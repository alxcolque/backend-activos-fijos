import { IProjectRepository } from '../../../domain/projects/project.repository.interface';
import { IAssetProjectRepository } from '../../../domain/asset-projects/asset-project.repository.interface';
import { IAssetRepository } from '../../../domain/assets/asset.repository.interface';
import { UpdateProjectInput } from '../../../interfaces/validators/projects/project.validator';
import { AppError, NotFoundError } from '../../../shared/errors/app-error';
import { logger } from '../../../infrastructure/logger/logger';

export class UpdateProjectUseCase {
  constructor(
    private projectRepository: IProjectRepository,
    private assetProjectRepository?: IAssetProjectRepository,
    private assetRepository?: IAssetRepository,
  ) {}

  async execute(id: string, input: UpdateProjectInput) {
    const currentProject = await this.projectRepository.findRawById(id);

    if (!currentProject) {
      throw new NotFoundError('Proyecto no encontrado.');
    }

    if (input.name && input.name !== currentProject.name) {
      const existingName = await this.projectRepository.findByName(input.name);
      if (existingName && existingName.id !== id) {
        throw new AppError('El nombre del proyecto ya existe.', 400);
      }
    }

    if (currentProject.status === 'FINISHED' && input.status === 'ACTIVE') {
      throw new AppError('Un proyecto finalizado no puede volver al estado ACTIVO.', 400);
    }

    const startDate =
      input.startDate !== undefined
        ? input.startDate
          ? new Date(input.startDate)
          : null
        : currentProject.startDate;

    const endDate =
      input.endDate !== undefined
        ? input.endDate
          ? new Date(input.endDate)
          : null
        : currentProject.endDate;

    if (startDate && endDate && startDate > endDate) {
      throw new AppError('La fecha de inicio no puede ser mayor que la fecha de finalización.', 400);
    }

    const updatedProject = await this.projectRepository.update(id, {
      name: input.name,
      address: input.address,
      responsible: input.responsible,
      status: input.status,
      startDate,
      endDate,
      description: input.description,
    });

    if (input.assignedAssets !== undefined && this.assetProjectRepository && this.assetRepository) {
      // Liberar asignaciones actuales de este proyecto
      const currentAssignments = await this.assetProjectRepository.findByProjectId(id, true);
      for (const assignment of currentAssignments) {
        await this.assetProjectRepository.release(assignment.id, 'Reasignación por edición de proyecto');
      }

      // Validar disponibilidad de las nuevas asignaciones
      for (const item of input.assignedAssets) {
        const asset = await this.assetRepository.findById(item.assetId);
        if (!asset) {
          throw new AppError(`El activo seleccionado no existe.`, 400);
        }
        const available = asset.quantity - asset.quantityOut;
        if (available <= 0) {
          throw new AppError(`El activo "${asset.name}" (${asset.code}) no tiene unidades disponibles.`, 400);
        }
        if (item.quantity > available) {
          throw new AppError(
            `No existen suficientes unidades disponibles para "${asset.name}" (${asset.code}). Disponible: ${available}, solicitado: ${item.quantity}.`,
            400,
          );
        }
      }

      // Registrar nuevas asignaciones
      for (const item of input.assignedAssets) {
        await this.assetProjectRepository.assign({
          assetId: item.assetId,
          projectId: id,
          quantity: item.quantity,
          observations: item.observations,
        });
      }
    }

    logger.info({ projectId: id }, 'Proyecto actualizado exitosamente');

    return updatedProject;
  }
}

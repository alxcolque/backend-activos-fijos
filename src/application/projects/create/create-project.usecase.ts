import { IProjectRepository } from '../../../domain/projects/project.repository.interface';
import { IAssetProjectRepository } from '../../../domain/asset-projects/asset-project.repository.interface';
import { IAssetRepository } from '../../../domain/assets/asset.repository.interface';
import { CreateProjectInput } from '../../../interfaces/validators/projects/project.validator';
import { AppError } from '../../../shared/errors/app-error';
import { logger } from '../../../infrastructure/logger/logger';

export class CreateProjectUseCase {
  constructor(
    private projectRepository: IProjectRepository,
    private assetProjectRepository?: IAssetProjectRepository,
    private assetRepository?: IAssetRepository,
  ) {}

  async execute(input: CreateProjectInput) {
    const existingName = await this.projectRepository.findByName(input.name);
    if (existingName) {
      throw new AppError('El nombre del proyecto ya existe.', 400);
    }

    const startDate = input.startDate ? new Date(input.startDate) : null;
    const endDate = input.endDate ? new Date(input.endDate) : null;

    if (startDate && endDate && startDate > endDate) {
      throw new AppError('La fecha de inicio no puede ser mayor que la fecha de finalización.', 400);
    }

    if (input.assignedAssets && input.assignedAssets.length > 0 && this.assetRepository) {
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
    }

    const project = await this.projectRepository.create({
      name: input.name,
      address: input.address,
      responsible: input.responsible,
      status: input.status,
      startDate,
      endDate,
      description: input.description,
    });

    if (input.assignedAssets && input.assignedAssets.length > 0 && this.assetProjectRepository) {
      for (const item of input.assignedAssets) {
        await this.assetProjectRepository.assign({
          assetId: item.assetId,
          projectId: project.id,
          quantity: item.quantity,
          observations: item.observations,
        });
      }
    }

    logger.info({ projectId: project.id, name: project.name }, 'Proyecto creado exitosamente');

    return project;
  }
}

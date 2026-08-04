import { IProjectRepository } from '../../../domain/projects/project.repository.interface';
import { CreateProjectInput } from '../../../interfaces/validators/projects/project.validator';
import { AppError } from '../../../shared/errors/app-error';
import { logger } from '../../../infrastructure/logger/logger';

export class CreateProjectUseCase {
  constructor(private projectRepository: IProjectRepository) {}

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

    const project = await this.projectRepository.create({
      name: input.name,
      address: input.address,
      responsible: input.responsible,
      status: input.status,
      startDate,
      endDate,
      description: input.description,
    });

    logger.info({ projectId: project.id, name: project.name }, 'Proyecto creado exitosamente');

    return project;
  }
}

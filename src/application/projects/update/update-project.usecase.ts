import { IProjectRepository } from '../../../domain/projects/project.repository.interface';
import { UpdateProjectInput } from '../../../interfaces/validators/projects/project.validator';
import { AppError, NotFoundError } from '../../../shared/errors/app-error';
import { logger } from '../../../infrastructure/logger/logger';

export class UpdateProjectUseCase {
  constructor(private projectRepository: IProjectRepository) {}

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

    // Regla de estado: Proyecto finalizado no puede reactivarse directamente
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

    logger.info({ projectId: id }, 'Proyecto actualizado exitosamente');

    return updatedProject;
  }
}

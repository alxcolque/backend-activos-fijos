import { IProjectRepository } from '../../../domain/projects/project.repository.interface';
import { AppError, NotFoundError } from '../../../shared/errors/app-error';
import { logger } from '../../../infrastructure/logger/logger';

export class DeleteProjectUseCase {
  constructor(private projectRepository: IProjectRepository) {}

  async execute(id: string) {
    const project = await this.projectRepository.findRawById(id);

    if (!project) {
      throw new NotFoundError('Proyecto no encontrado.');
    }

    const hasAssets = await this.projectRepository.existsAssets(id);

    if (hasAssets) {
      throw new AppError('No es posible eliminar un proyecto con activos asociados.', 400);
    }

    await this.projectRepository.delete(id);
    logger.info({ projectId: id }, 'Proyecto eliminado exitosamente (Soft Delete)');

    return {
      message: 'Proyecto eliminado correctamente.',
    };
  }
}

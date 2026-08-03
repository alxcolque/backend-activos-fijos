import { IProjectRepository } from '../../../domain/projects/project.repository.interface';
import { NotFoundError } from '../../../shared/errors/app-error';

export class GetProjectUseCase {
  constructor(private projectRepository: IProjectRepository) {}

  async execute(id: string) {
    const project = await this.projectRepository.findById(id);

    if (!project) {
      throw new NotFoundError('Proyecto no encontrado.');
    }

    return project;
  }
}

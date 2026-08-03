import {
  IProjectRepository,
  FindAllProjectsOptions,
} from '../../../domain/projects/project.repository.interface';
import { logger } from '../../../infrastructure/logger/logger';

export class GetProjectsUseCase {
  constructor(private projectRepository: IProjectRepository) {}

  async execute(options: FindAllProjectsOptions) {
    logger.info({ options }, 'Consulta de proyectos');
    return this.projectRepository.findAll(options);
  }
}

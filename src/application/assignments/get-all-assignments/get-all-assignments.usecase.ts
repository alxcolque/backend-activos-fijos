import {
  IAssignmentRepository,
  FindAllAssignmentsOptions,
} from '../../../domain/assignments/assignment.repository.interface';
import { logger } from '../../../infrastructure/logger/logger';

export class GetAllAssignmentsUseCase {
  constructor(private assignmentRepository: IAssignmentRepository) {}

  async execute(options: FindAllAssignmentsOptions) {
    logger.info({ options }, 'Consulta de asignaciones a custodios');
    return this.assignmentRepository.findAll(options);
  }
}

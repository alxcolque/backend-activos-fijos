import { IAssignmentRepository } from '../../../domain/assignments/assignment.repository.interface';
import { NotFoundError } from '../../../shared/errors/app-error';

export class GetAssignmentByIdUseCase {
  constructor(private assignmentRepository: IAssignmentRepository) {}

  async execute(id: string) {
    const assignment = await this.assignmentRepository.findById(id);

    if (!assignment) {
      throw new NotFoundError('Registro de asignación no encontrado.');
    }

    return assignment;
  }
}

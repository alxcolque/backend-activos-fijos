import { IAssignmentRepository } from '../../../domain/assignments/assignment.repository.interface';
import { AssignCustodianInput } from '../../../interfaces/validators/assignments/assignment.validator';
import { AppError, NotFoundError } from '../../../shared/errors/app-error';
import { logger } from '../../../infrastructure/logger/logger';
import { logAssetHistory } from '../../../shared/utils/audit.util';

export class AssignCustodianUseCase {
  constructor(private assignmentRepository: IAssignmentRepository) {}

  async execute(input: AssignCustodianInput, userId?: string) {
    const assetExists = await this.assignmentRepository.existsAsset(input.assetId);
    if (!assetExists) {
      throw new NotFoundError('Activo no encontrado.');
    }

    const activeAssignment = await this.assignmentRepository.findActiveAssignmentByAssetId(input.assetId);
    if (activeAssignment) {
      throw new AppError('El activo ya posee un custodio asignado actualmente.', 400);
    }

    const assignment = await this.assignmentRepository.assign(input);

    logger.info({ assetId: input.assetId, responsibleName: input.responsibleName }, 'Custodio asignado a activo');
    await logAssetHistory(
      input.assetId,
      userId,
      'CUSTODIAN_ASSIGN',
      `Custodia asignada a ${input.responsibleName} (${input.position || 'Sin cargo'})`,
    );

    return assignment;
  }
}

import { IAssignmentRepository } from '../../../domain/assignments/assignment.repository.interface';
import { ReturnAssetInput } from '../../../interfaces/validators/assignments/assignment.validator';
import { AppError, NotFoundError } from '../../../shared/errors/app-error';
import { logger } from '../../../infrastructure/logger/logger';
import { logAssetHistory } from '../../../shared/utils/audit.util';

export class ReturnAssetUseCase {
  constructor(private assignmentRepository: IAssignmentRepository) {}

  async execute(input: ReturnAssetInput, userId?: string) {
    const activeAssignment = await this.assignmentRepository.findActiveAssignmentByAssetId(input.assetId);

    if (!activeAssignment) {
      throw new AppError('El activo no tiene un custodio asignado actualmente.', 400);
    }

    const updated = await this.assignmentRepository.returnAsset(activeAssignment.id, input.observations);

    logger.info({ assetId: input.assetId }, 'Devolución de custodia de activo registrada');
    await logAssetHistory(
      input.assetId,
      userId,
      'CUSTODIAN_RETURN',
      `Devolución de custodia registrada por ${activeAssignment.responsibleName}`,
    );

    return updated;
  }
}

import { IAssignmentRepository } from '../../../domain/assignments/assignment.repository.interface';
import { NotFoundError } from '../../../shared/errors/app-error';

export class GetAssetCustodiansUseCase {
  constructor(private assignmentRepository: IAssignmentRepository) {}

  async execute(assetId: string) {
    const assetExists = await this.assignmentRepository.existsAsset(assetId);
    if (!assetExists) {
      throw new NotFoundError('Activo no encontrado.');
    }

    return this.assignmentRepository.findByAssetId(assetId);
  }
}

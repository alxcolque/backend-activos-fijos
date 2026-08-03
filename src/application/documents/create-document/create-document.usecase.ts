import { IDocumentRepository } from '../../../domain/documents/document.repository.interface';
import { CreateDocumentInput } from '../../../interfaces/validators/documents/document.validator';
import { NotFoundError } from '../../../shared/errors/app-error';
import { logger } from '../../../infrastructure/logger/logger';
import { logAssetHistory } from '../../../shared/utils/audit.util';

export class CreateDocumentUseCase {
  constructor(private documentRepository: IDocumentRepository) {}

  async execute(input: CreateDocumentInput, userId?: string) {
    const assetExists = await this.documentRepository.existsAsset(input.assetId);
    if (!assetExists) {
      throw new NotFoundError('Activo no encontrado.');
    }

    const doc = await this.documentRepository.create(input);

    logger.info({ documentId: doc.id, assetId: input.assetId }, 'Documento asociado al activo');
    await logAssetHistory(
      input.assetId,
      userId,
      'DOCUMENT_ADD',
      `Documento '${input.originalName}' (${input.type}) adjuntado al activo`,
    );

    return doc;
  }
}

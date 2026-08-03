import { IDocumentRepository } from '../../../domain/documents/document.repository.interface';
import { NotFoundError } from '../../../shared/errors/app-error';
import { logger } from '../../../infrastructure/logger/logger';
import { logAssetHistory } from '../../../shared/utils/audit.util';

export class DeleteDocumentUseCase {
  constructor(private documentRepository: IDocumentRepository) {}

  async execute(id: string, userId?: string) {
    const doc = await this.documentRepository.findById(id);

    if (!doc) {
      throw new NotFoundError('Documento no encontrado.');
    }

    await this.documentRepository.delete(id);

    logger.info({ documentId: id }, 'Documento eliminado correctamente');
    await logAssetHistory(
      doc.assetId,
      userId,
      'DOCUMENT_REMOVE',
      `Documento '${doc.originalName}' eliminado`,
    );

    return {
      message: 'Documento eliminado correctamente.',
    };
  }
}

import { DocumentType } from '../../../domain/enums/document-type.enum';
import { IDocumentRepository } from '../../../domain/documents/document.repository.interface';
import { NotFoundError } from '../../../shared/errors/app-error';

export class GetAssetDocumentsUseCase {
  constructor(private documentRepository: IDocumentRepository) {}

  async execute(assetId: string, type?: DocumentType) {
    const assetExists = await this.documentRepository.existsAsset(assetId);
    if (!assetExists) {
      throw new NotFoundError('Activo no encontrado.');
    }

    return this.documentRepository.findByAssetId(assetId, type);
  }
}

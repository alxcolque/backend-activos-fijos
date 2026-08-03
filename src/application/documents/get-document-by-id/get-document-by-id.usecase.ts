import { IDocumentRepository } from '../../../domain/documents/document.repository.interface';
import { NotFoundError } from '../../../shared/errors/app-error';

export class GetDocumentByIdUseCase {
  constructor(private documentRepository: IDocumentRepository) {}

  async execute(id: string) {
    const doc = await this.documentRepository.findById(id);

    if (!doc) {
      throw new NotFoundError('Documento no encontrado.');
    }

    return doc;
  }
}

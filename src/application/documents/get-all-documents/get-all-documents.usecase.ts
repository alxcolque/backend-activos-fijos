import {
  IDocumentRepository,
  FindAllDocumentsOptions,
} from '../../../domain/documents/document.repository.interface';
import { logger } from '../../../infrastructure/logger/logger';

export class GetAllDocumentsUseCase {
  constructor(private documentRepository: IDocumentRepository) {}

  async execute(options: FindAllDocumentsOptions) {
    logger.info({ options }, 'Consulta general de documentos de activos');
    return this.documentRepository.findAll(options);
  }
}

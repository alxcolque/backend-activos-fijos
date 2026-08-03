import { IUploadService } from '../../../domain/uploads/upload.service.interface';
import { logger } from '../../../infrastructure/logger/logger';

export class UploadFileUseCase {
  constructor(private uploadService: IUploadService) {}

  async execute(
    fileBuffer: Buffer,
    originalName: string,
    mimeType: string,
    folder?: string,
  ) {
    logger.info({ originalName, mimeType, folder }, 'Procesando subida de archivo');
    return this.uploadService.saveFile(fileBuffer, originalName, mimeType, folder);
  }
}

import { IUploadService } from '../../../domain/uploads/upload.service.interface';
import { logger } from '../../../infrastructure/logger/logger';
import { AppError } from '../../../shared/errors/app-error';

export class UploadFileUseCase {
  constructor(private uploadService: IUploadService) {}

  async execute(
    fileBuffer: Buffer,
    originalName: string,
    mimeType: string,
    folder?: string,
  ) {
    logger.info({ originalName, mimeType, folder }, 'Procesando subida de archivo');

    if (folder === 'photos' && !mimeType.startsWith('image/')) {
      throw new AppError('Solo se permiten archivos de imagen (PNG, JPG, JPEG, WEBP, GIF, SVG).', 400);
    }

    return this.uploadService.saveFile(fileBuffer, originalName, mimeType, folder);
  }
}

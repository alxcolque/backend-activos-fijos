import { IUploadService } from '../../../domain/uploads/upload.service.interface';
import { NotFoundError } from '../../../shared/errors/app-error';
import { logger } from '../../../infrastructure/logger/logger';

export class DeleteFileUseCase {
  constructor(private uploadService: IUploadService) {}

  async execute(filePath: string) {
    const deleted = await this.uploadService.deleteFile(filePath);

    if (!deleted) {
      throw new NotFoundError('Archivo no encontrado en el servidor.');
    }

    logger.info({ filePath }, 'Archivo eliminado exitosamente');

    return {
      message: 'Archivo eliminado correctamente.',
    };
  }
}

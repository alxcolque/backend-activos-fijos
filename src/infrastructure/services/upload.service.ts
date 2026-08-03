import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import {
  IUploadService,
  UploadedFileResult,
} from '../../domain/uploads/upload.service.interface';
import { logger } from '../logger/logger';

export class UploadService implements IUploadService {
  private baseUploadDir: string;

  constructor() {
    this.baseUploadDir = path.join(process.cwd(), 'uploads');
    this.ensureDir(this.baseUploadDir);
    this.ensureDir(path.join(this.baseUploadDir, 'photos'));
    this.ensureDir(path.join(this.baseUploadDir, 'documents'));
    this.ensureDir(path.join(this.baseUploadDir, 'general'));
  }

  private ensureDir(dirPath: string) {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  async saveFile(
    fileBuffer: Buffer,
    originalName: string,
    mimeType: string,
    folder = 'general',
  ): Promise<UploadedFileResult> {
    const validFolder = ['photos', 'documents', 'general'].includes(folder) ? folder : 'general';
    const targetDir = path.join(this.baseUploadDir, validFolder);
    this.ensureDir(targetDir);

    const ext = path.extname(originalName).replace('.', '') || 'bin';
    const uniqueFileName = `${uuidv4()}-${Date.now()}.${ext}`;
    const fullFilePath = path.join(targetDir, uniqueFileName);

    await fs.promises.writeFile(fullFilePath, fileBuffer);

    const relativePath = `uploads/${validFolder}/${uniqueFileName}`;
    const publicUrl = `/${relativePath}`;

    logger.info({ relativePath }, 'Archivo guardado en el servidor');

    return {
      fileName: uniqueFileName,
      originalName,
      mimeType,
      extension: ext,
      size: fileBuffer.length,
      path: relativePath,
      url: publicUrl,
    };
  }

  async deleteFile(relativeFilePath: string): Promise<boolean> {
    try {
      const cleanPath = relativeFilePath.startsWith('/')
        ? relativeFilePath.substring(1)
        : relativeFilePath;

      const fullPath = path.join(process.cwd(), cleanPath);

      if (fs.existsSync(fullPath)) {
        await fs.promises.unlink(fullPath);
        logger.info({ relativeFilePath }, 'Archivo eliminado físicamente');
        return true;
      }
      return false;
    } catch (error) {
      logger.warn({ error, relativeFilePath }, 'No se pudo eliminar el archivo en disco');
      return false;
    }
  }
}

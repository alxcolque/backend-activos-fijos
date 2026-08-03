export interface UploadedFileResult {
  fileName: string;
  originalName: string;
  mimeType: string;
  extension: string;
  size: number;
  path: string;
  url: string;
}

export interface IUploadService {
  saveFile(
    fileBuffer: Buffer,
    originalName: string,
    mimeType: string,
    folder?: string,
  ): Promise<UploadedFileResult>;
  deleteFile(relativeFilePath: string): Promise<boolean>;
}

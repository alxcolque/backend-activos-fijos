import { FastifyRequest, FastifyReply } from 'fastify';
import { UploadService } from '../../infrastructure/services/upload.service';
import { UploadFileUseCase } from '../../application/uploads/upload-file/upload-file.usecase';
import { DeleteFileUseCase } from '../../application/uploads/delete-file/delete-file.usecase';
import { deleteFileSchema } from '../validators/uploads/upload.validator';
import { successResponse } from '../../shared/utils/response.util';
import { AppError } from '../../shared/errors/app-error';

const service = new UploadService();
const uploadFileUseCase = new UploadFileUseCase(service);
const deleteFileUseCase = new DeleteFileUseCase(service);

export class UploadController {
  public static async uploadFile(request: FastifyRequest, reply: FastifyReply) {
    if (!request.isMultipart()) {
      throw new AppError('La petición debe ser de tipo multipart/form-data.', 400);
    }

    const data = await request.file();

    if (!data) {
      throw new AppError('Debe seleccionar un archivo para subir.', 400);
    }

    const buffer = await data.toBuffer();
    const folderField = (data.fields.folder as any)?.value || 'general';

    const result = await uploadFileUseCase.execute(
      buffer,
      data.filename,
      data.mimetype,
      folderField,
    );

    return reply.status(201).send(successResponse(result, 'Archivo subido exitosamente.'));
  }

  public static async deleteFile(request: FastifyRequest, reply: FastifyReply) {
    const validatedBody = deleteFileSchema.parse(request.body);
    const result = await deleteFileUseCase.execute(validatedBody.path);
    return reply.status(200).send(successResponse(null, result.message));
  }
}

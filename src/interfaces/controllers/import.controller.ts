import { FastifyRequest, FastifyReply } from 'fastify';
import { RepositoryFactory } from '../../infrastructure/database/repository.factory';
import { ImportExcelUseCase } from '../../application/import/import-excel/import-excel.usecase';
import { GetTemplateUseCase } from '../../application/import/get-template/get-template.usecase';
import { importPayloadSchema } from '../validators/import/import.validator';
import { successResponse } from '../../shared/utils/response.util';

const repository = RepositoryFactory.getImportRepository();
const importExcelUseCase = new ImportExcelUseCase(repository);
const getTemplateUseCase = new GetTemplateUseCase();

export class ImportController {
  public static async importExcel(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.user?.id;

    // Check if multipart file upload
    if (request.isMultipart()) {
      const data = await request.file();
      if (!data) {
        return reply.status(400).send({
          success: false,
          message: 'Debe adjuntar un archivo Excel para la importación.',
        });
      }
      const buffer = await data.toBuffer();
      const result = await importExcelUseCase.executeFromBuffer(buffer, userId);
      return reply.status(200).send(successResponse(result, 'Importación masiva completada.'));
    }

    // Otherwise expect JSON rows batch
    const validatedBody = importPayloadSchema.parse(request.body);
    const result = await importExcelUseCase.executeRows(validatedBody.rows, userId);
    return reply.status(200).send(successResponse(result, 'Importación masiva completada.'));
  }

  public static async getTemplate(_request: FastifyRequest, reply: FastifyReply) {
    const template = getTemplateUseCase.execute();
    return reply.status(200).send(successResponse(template));
  }
}

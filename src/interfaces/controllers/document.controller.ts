import { FastifyRequest, FastifyReply } from 'fastify';
import { DocumentRepository } from '../../infrastructure/repositories/document.repository';
import { CreateDocumentUseCase } from '../../application/documents/create-document/create-document.usecase';
import { DeleteDocumentUseCase } from '../../application/documents/delete-document/delete-document.usecase';
import { GetAssetDocumentsUseCase } from '../../application/documents/get-asset-documents/get-asset-documents.usecase';
import { GetDocumentByIdUseCase } from '../../application/documents/get-document-by-id/get-document-by-id.usecase';
import { GetAllDocumentsUseCase } from '../../application/documents/get-all-documents/get-all-documents.usecase';
import {
  createDocumentSchema,
  queryDocumentSchema,
} from '../validators/documents/document.validator';
import { successResponse } from '../../shared/utils/response.util';
import { DocumentType } from '@prisma/client';

const repository = new DocumentRepository();
const createDocumentUseCase = new CreateDocumentUseCase(repository);
const deleteDocumentUseCase = new DeleteDocumentUseCase(repository);
const getAssetDocumentsUseCase = new GetAssetDocumentsUseCase(repository);
const getDocumentByIdUseCase = new GetDocumentByIdUseCase(repository);
const getAllDocumentsUseCase = new GetAllDocumentsUseCase(repository);

export class DocumentController {
  public static async createDocument(request: FastifyRequest, reply: FastifyReply) {
    const validatedBody = createDocumentSchema.parse(request.body);
    const userId = request.user?.id;
    const result = await createDocumentUseCase.execute(validatedBody, userId);
    return reply.status(201).send(successResponse(result, 'Documento asociado al activo exitosamente.'));
  }

  public static async deleteDocument(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const userId = request.user?.id;
    const result = await deleteDocumentUseCase.execute(id, userId);
    return reply.status(200).send(successResponse(null, result.message));
  }

  public static async getAssetDocuments(request: FastifyRequest, reply: FastifyReply) {
    const { assetId } = request.params as { assetId: string };
    const { type } = request.query as { type?: DocumentType };
    const result = await getAssetDocumentsUseCase.execute(assetId, type);
    return reply.status(200).send(successResponse(result));
  }

  public static async getDocumentById(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const result = await getDocumentByIdUseCase.execute(id);
    return reply.status(200).send(successResponse(result));
  }

  public static async getAllDocuments(request: FastifyRequest, reply: FastifyReply) {
    const validatedQuery = queryDocumentSchema.parse(request.query);
    const result = await getAllDocumentsUseCase.execute(validatedQuery);
    return reply.status(200).send({
      success: true,
      message: 'Documentos obtenidos correctamente.',
      data: result.data,
      pagination: result.pagination,
    });
  }
}

import { FastifyRequest, FastifyReply } from 'fastify';
import { RepositoryFactory } from '../../infrastructure/database/repository.factory';
import { AssignCustodianUseCase } from '../../application/assignments/assign-custodian/assign-custodian.usecase';
import { ReturnAssetUseCase } from '../../application/assignments/return-asset/return-asset.usecase';
import { GetAssetCustodiansUseCase } from '../../application/assignments/get-asset-custodians/get-asset-custodians.usecase';
import { GetAssignmentByIdUseCase } from '../../application/assignments/get-assignment-by-id/get-assignment-by-id.usecase';
import { GetAllAssignmentsUseCase } from '../../application/assignments/get-all-assignments/get-all-assignments.usecase';
import {
  assignCustodianSchema,
  returnAssetSchema,
  queryAssignmentSchema,
} from '../validators/assignments/assignment.validator';
import { successResponse } from '../../shared/utils/response.util';

const repository = RepositoryFactory.getAssignmentRepository();
const assignCustodianUseCase = new AssignCustodianUseCase(repository);
const returnAssetUseCase = new ReturnAssetUseCase(repository);
const getAssetCustodiansUseCase = new GetAssetCustodiansUseCase(repository);
const getAssignmentByIdUseCase = new GetAssignmentByIdUseCase(repository);
const getAllAssignmentsUseCase = new GetAllAssignmentsUseCase(repository);

export class AssignmentController {
  public static async assignCustodian(request: FastifyRequest, reply: FastifyReply) {
    const validatedBody = assignCustodianSchema.parse(request.body);
    const userId = request.user?.id;
    const result = await assignCustodianUseCase.execute(validatedBody, userId);
    return reply.status(201).send(successResponse(result, 'Activo asignado al custodio exitosamente.'));
  }

  public static async returnAsset(request: FastifyRequest, reply: FastifyReply) {
    const validatedBody = returnAssetSchema.parse(request.body);
    const userId = request.user?.id;
    const result = await returnAssetUseCase.execute(validatedBody, userId);
    return reply.status(200).send(successResponse(result, 'Devolución de activo registrada correctamente.'));
  }

  public static async getAssetCustodians(request: FastifyRequest, reply: FastifyReply) {
    const { assetId } = request.params as { assetId: string };
    const result = await getAssetCustodiansUseCase.execute(assetId);
    return reply.status(200).send(successResponse(result));
  }

  public static async getAssignmentById(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const result = await getAssignmentByIdUseCase.execute(id);
    return reply.status(200).send(successResponse(result));
  }

  public static async getAllAssignments(request: FastifyRequest, reply: FastifyReply) {
    const validatedQuery = queryAssignmentSchema.parse(request.query);
    const result = await getAllAssignmentsUseCase.execute(validatedQuery);
    return reply.status(200).send({
      success: true,
      message: 'Asignaciones a custodios obtenidas correctamente.',
      data: result.data,
      pagination: result.pagination,
    });
  }
}

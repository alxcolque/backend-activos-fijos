import { FastifyRequest, FastifyReply } from 'fastify';
import { RepositoryFactory } from '../../infrastructure/database/repository.factory';
import { AssignAssetUseCase } from '../../application/asset-projects/assign-asset/assign-asset.usecase';
import { ReleaseAssetUseCase } from '../../application/asset-projects/release-asset/release-asset.usecase';
import { GetProjectAssetsUseCase } from '../../application/asset-projects/get-project-assets/get-project-assets.usecase';
import { GetAssetProjectsHistoryUseCase } from '../../application/asset-projects/get-asset-projects-history/get-asset-projects-history.usecase';
import { GetAllAssignmentsUseCase } from '../../application/asset-projects/get-all-assignments/get-all-assignments.usecase';
import {
  assignAssetSchema,
  releaseAssetSchema,
  queryAssetProjectSchema,
} from '../validators/asset-projects/asset-project.validator';
import { successResponse } from '../../shared/utils/response.util';

const repository = RepositoryFactory.getAssetProjectRepository();
const assignAssetUseCase = new AssignAssetUseCase(repository);
const releaseAssetUseCase = new ReleaseAssetUseCase(repository);
const getProjectAssetsUseCase = new GetProjectAssetsUseCase(repository);
const getAssetProjectsHistoryUseCase = new GetAssetProjectsHistoryUseCase(repository);
const getAllAssignmentsUseCase = new GetAllAssignmentsUseCase(repository);

export class AssetProjectController {
  public static async assignAsset(request: FastifyRequest, reply: FastifyReply) {
    const validatedBody = assignAssetSchema.parse(request.body);
    const userId = request.user?.id;
    const result = await assignAssetUseCase.execute(validatedBody, userId);
    return reply.status(201).send(successResponse(result, 'Activo asignado al proyecto exitosamente.'));
  }

  public static async releaseAsset(request: FastifyRequest, reply: FastifyReply) {
    const validatedBody = releaseAssetSchema.parse(request.body);
    const userId = request.user?.id;
    const result = await releaseAssetUseCase.execute(validatedBody, userId);
    return reply.status(200).send(successResponse(result, 'Activo liberado del proyecto exitosamente.'));
  }

  public static async getProjectAssets(request: FastifyRequest, reply: FastifyReply) {
    const { projectId } = request.params as { projectId: string };
    const { activeOnly } = request.query as { activeOnly?: string };
    const result = await getProjectAssetsUseCase.execute(projectId, activeOnly === 'true');
    return reply.status(200).send(successResponse(result));
  }

  public static async getAssetHistory(request: FastifyRequest, reply: FastifyReply) {
    const { assetId } = request.params as { assetId: string };
    const result = await getAssetProjectsHistoryUseCase.execute(assetId);
    return reply.status(200).send(successResponse(result));
  }

  public static async getAllAssignments(request: FastifyRequest, reply: FastifyReply) {
    const validatedQuery = queryAssetProjectSchema.parse(request.query);
    const result = await getAllAssignmentsUseCase.execute(validatedQuery);
    return reply.status(200).send({
      success: true,
      message: 'Asignaciones obtenidas correctamente.',
      data: result.data,
      pagination: result.pagination,
    });
  }
}

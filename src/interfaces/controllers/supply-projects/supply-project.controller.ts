import { FastifyRequest, FastifyReply } from 'fastify';
import { RepositoryFactory } from '../../../infrastructure/database/repository.factory';
import {
  assignSupplyProjectSchema,
  releaseSupplyProjectSchema,
} from '../../validators/supply-projects/supply-project.validator';
import { successResponse } from '../../../shared/utils/response.util';

const supplyProjectRepository = RepositoryFactory.getSupplyProjectRepository();

export class SupplyProjectController {
  public static async getByProjectId(request: FastifyRequest, reply: FastifyReply) {
    const { projectId } = request.params as { projectId: string };
    const items = await supplyProjectRepository.findByProjectId(projectId);
    return reply.status(200).send(successResponse(items, 'Suministros asignados al proyecto obtenidos correctamente.'));
  }

  public static async assign(request: FastifyRequest, reply: FastifyReply) {
    const validatedBody = assignSupplyProjectSchema.parse(request.body);
    const item = await supplyProjectRepository.assign(validatedBody);
    return reply.status(201).send(successResponse(item, 'Suministro asignado al proyecto exitosamente.'));
  }

  public static async release(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const validatedBody = releaseSupplyProjectSchema.parse(request.body || {});
    const item = await supplyProjectRepository.release({ id, ...validatedBody });
    return reply.status(200).send(successResponse(item, 'Suministro liberado del proyecto correctamente.'));
  }

  public static async delete(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    await supplyProjectRepository.delete(id);
    return reply.status(200).send(successResponse(null, 'Asignación de suministro eliminada correctamente.'));
  }
}

import { FastifyRequest, FastifyReply } from 'fastify';
import { StatusRepository } from '../../infrastructure/repositories/status.repository';
import { GetStatusesUseCase } from '../../application/status/get-statuses/get-statuses.usecase';
import { GetStatusByIdUseCase } from '../../application/status/get-status-by-id/get-status-by-id.usecase';
import { CreateStatusUseCase } from '../../application/status/create-status/create-status.usecase';
import { UpdateStatusUseCase } from '../../application/status/update-status/update-status.usecase';
import { DeleteStatusUseCase } from '../../application/status/delete-status/delete-status.usecase';
import {
  createStatusSchema,
  updateStatusSchema,
} from '../validators/status/status.validator';
import { successResponse } from '../../shared/utils/response.util';

const statusRepository = new StatusRepository();
const getStatusesUseCase = new GetStatusesUseCase(statusRepository);
const getStatusByIdUseCase = new GetStatusByIdUseCase(statusRepository);
const createStatusUseCase = new CreateStatusUseCase(statusRepository);
const updateStatusUseCase = new UpdateStatusUseCase(statusRepository);
const deleteStatusUseCase = new DeleteStatusUseCase(statusRepository);

export class StatusController {
  public static async getStatuses(request: FastifyRequest, reply: FastifyReply) {
    const { search } = request.query as { search?: string };
    const statuses = await getStatusesUseCase.execute(search);
    return reply.status(200).send(successResponse(statuses, 'Estados operativos obtenidos correctamente.'));
  }

  public static async getStatusById(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const status = await getStatusByIdUseCase.execute(id);
    return reply.status(200).send(successResponse(status));
  }

  public static async createStatus(request: FastifyRequest, reply: FastifyReply) {
    const validatedBody = createStatusSchema.parse(request.body);
    const status = await createStatusUseCase.execute(validatedBody);
    return reply.status(201).send(successResponse(status, 'Estado operativo creado exitosamente.'));
  }

  public static async updateStatus(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const validatedBody = updateStatusSchema.parse(request.body);
    const status = await updateStatusUseCase.execute(id, validatedBody);
    return reply.status(200).send(successResponse(status, 'Estado operativo actualizado exitosamente.'));
  }

  public static async deleteStatus(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const result = await deleteStatusUseCase.execute(id);
    return reply.status(200).send(successResponse(null, result.message));
  }
}

import { FastifyRequest, FastifyReply } from 'fastify';
import { RepositoryFactory } from '../../../infrastructure/database/repository.factory';
import {
  createAcquisitionSchema,
  updateAcquisitionSchema,
  queryAcquisitionSchema,
  addAcquisitionDetailSchema,
} from '../../validators/acquisitions/acquisition.validator';
import { successResponse } from '../../../shared/utils/response.util';
import { NotFoundError } from '../../../shared/errors/app-error';

const acquisitionRepo = RepositoryFactory.getAcquisitionRepository();

export class AcquisitionController {
  public static async getAcquisitions(request: FastifyRequest, reply: FastifyReply) {
    const validatedQuery = queryAcquisitionSchema.parse(request.query);
    const { data, total } = await acquisitionRepo.findAll(validatedQuery);

    const totalPages = Math.ceil(total / validatedQuery.limit);

    return reply.status(200).send({
      success: true,
      message: 'Registros de personal obtenidos correctamente.',
      data,
      pagination: {
        total,
        page: validatedQuery.page,
        limit: validatedQuery.limit,
        totalPages,
      },
    });
  }

  public static async getAcquisitionById(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const item = await acquisitionRepo.findById(id);

    if (!item) {
      throw new NotFoundError('Registro de personal no encontrado.');
    }

    return reply.status(200).send(successResponse(item));
  }

  public static async createAcquisition(request: FastifyRequest, reply: FastifyReply) {
    const validatedBody = createAcquisitionSchema.parse(request.body);
    const created = await acquisitionRepo.create(validatedBody);

    return reply.status(201).send(successResponse(created, 'Registro de personal creado exitosamente.'));
  }

  public static async updateAcquisition(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const validatedBody = updateAcquisitionSchema.parse(request.body);

    const existing = await acquisitionRepo.findById(id);
    if (!existing) {
      throw new NotFoundError('Registro de personal no encontrado.');
    }

    const updated = await acquisitionRepo.update(id, validatedBody);

    return reply.status(200).send(successResponse(updated, 'Registro de personal actualizado exitosamente.'));
  }

  public static async deleteAcquisition(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };

    const existing = await acquisitionRepo.findById(id);
    if (!existing) {
      throw new NotFoundError('Registro de personal no encontrado.');
    }

    await acquisitionRepo.delete(id);

    return reply.status(200).send(successResponse(null, 'Registro de personal eliminado correctamente.'));
  }

  public static async addDetail(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const validatedBody = addAcquisitionDetailSchema.parse(request.body);

    const acquisition = await acquisitionRepo.findById(id);
    if (!acquisition) {
      throw new NotFoundError('Registro de personal no encontrado.');
    }

    const createdDetail = await acquisitionRepo.addDetail({
      acquisitionId: id,
      supplyId: validatedBody.supplyId,
      assetId: validatedBody.assetId,
      unit: validatedBody.unit,
      quantity: validatedBody.quantity,
    });

    return reply.status(201).send(successResponse(createdDetail, 'Detalle agregado exitosamente.'));
  }

  public static async deleteDetail(request: FastifyRequest, reply: FastifyReply) {
    const { detailId } = request.params as { detailId: string };
    await acquisitionRepo.deleteDetail(detailId);
    return reply.status(200).send(successResponse(null, 'Detalle eliminado correctamente.'));
  }
}

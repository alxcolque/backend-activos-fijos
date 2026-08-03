import { FastifyRequest, FastifyReply } from 'fastify';
import { MaintenanceRepository } from '../../infrastructure/repositories/maintenance.repository';
import { CreateMaintenanceUseCase } from '../../application/maintenances/create-maintenance/create-maintenance.usecase';
import { UpdateMaintenanceUseCase } from '../../application/maintenances/update-maintenance/update-maintenance.usecase';
import { DeleteMaintenanceUseCase } from '../../application/maintenances/delete-maintenance/delete-maintenance.usecase';
import { GetAssetMaintenancesUseCase } from '../../application/maintenances/get-asset-maintenances/get-asset-maintenances.usecase';
import { GetMaintenanceByIdUseCase } from '../../application/maintenances/get-maintenance-by-id/get-maintenance-by-id.usecase';
import { GetAllMaintenancesUseCase } from '../../application/maintenances/get-all-maintenances/get-all-maintenances.usecase';
import {
  createMaintenanceSchema,
  updateMaintenanceSchema,
  queryMaintenanceSchema,
} from '../validators/maintenances/maintenance.validator';
import { successResponse } from '../../shared/utils/response.util';
import { MaintenanceType } from '@prisma/client';

const repository = new MaintenanceRepository();
const createMaintenanceUseCase = new CreateMaintenanceUseCase(repository);
const updateMaintenanceUseCase = new UpdateMaintenanceUseCase(repository);
const deleteMaintenanceUseCase = new DeleteMaintenanceUseCase(repository);
const getAssetMaintenancesUseCase = new GetAssetMaintenancesUseCase(repository);
const getMaintenanceByIdUseCase = new GetMaintenanceByIdUseCase(repository);
const getAllMaintenancesUseCase = new GetAllMaintenancesUseCase(repository);

export class MaintenanceController {
  public static async createMaintenance(request: FastifyRequest, reply: FastifyReply) {
    const validatedBody = createMaintenanceSchema.parse(request.body);
    const userId = request.user?.id;
    const result = await createMaintenanceUseCase.execute(validatedBody, userId);
    return reply.status(201).send(successResponse(result, 'Mantenimiento registrado exitosamente.'));
  }

  public static async updateMaintenance(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const validatedBody = updateMaintenanceSchema.parse(request.body);
    const userId = request.user?.id;
    const result = await updateMaintenanceUseCase.execute(id, validatedBody, userId);
    return reply.status(200).send(successResponse(result, 'Mantenimiento actualizado exitosamente.'));
  }

  public static async deleteMaintenance(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const userId = request.user?.id;
    const result = await deleteMaintenanceUseCase.execute(id, userId);
    return reply.status(200).send(successResponse(null, result.message));
  }

  public static async getAssetMaintenances(request: FastifyRequest, reply: FastifyReply) {
    const { assetId } = request.params as { assetId: string };
    const { type } = request.query as { type?: MaintenanceType };
    const result = await getAssetMaintenancesUseCase.execute(assetId, type);
    return reply.status(200).send(successResponse(result));
  }

  public static async getMaintenanceById(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const result = await getMaintenanceByIdUseCase.execute(id);
    return reply.status(200).send(successResponse(result));
  }

  public static async getAllMaintenances(request: FastifyRequest, reply: FastifyReply) {
    const validatedQuery = queryMaintenanceSchema.parse(request.query);
    const result = await getAllMaintenancesUseCase.execute(validatedQuery);
    return reply.status(200).send({
      success: true,
      message: 'Mantenimientos obtenidos correctamente.',
      data: result.data,
      pagination: result.pagination,
    });
  }
}

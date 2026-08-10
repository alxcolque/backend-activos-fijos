import { FastifyRequest, FastifyReply } from 'fastify';
import { RepositoryFactory } from '../../infrastructure/database/repository.factory';
import { CreateInventoryUseCase } from '../../application/inventories/create-inventory/create-inventory.usecase';
import { DeleteInventoryUseCase } from '../../application/inventories/delete-inventory/delete-inventory.usecase';
import { RegisterInventoryItemUseCase } from '../../application/inventories/register-inventory-item/register-inventory-item.usecase';
import { GetInventoryByIdUseCase } from '../../application/inventories/get-inventory-by-id/get-inventory-by-id.usecase';
import { GetInventoryItemsUseCase } from '../../application/inventories/get-inventory-items/get-inventory-items.usecase';
import { GetAllInventoriesUseCase } from '../../application/inventories/get-all-inventories/get-all-inventories.usecase';
import {
  createInventorySchema,
  registerInventoryItemSchema,
  queryInventorySchema,
} from '../validators/inventories/inventory.validator';
import { successResponse } from '../../shared/utils/response.util';

const repository = RepositoryFactory.getInventoryRepository();
const createInventoryUseCase = new CreateInventoryUseCase(repository);
const deleteInventoryUseCase = new DeleteInventoryUseCase(repository);
const registerInventoryItemUseCase = new RegisterInventoryItemUseCase(repository);
const getInventoryByIdUseCase = new GetInventoryByIdUseCase(repository);
const getInventoryItemsUseCase = new GetInventoryItemsUseCase(repository);
const getAllInventoriesUseCase = new GetAllInventoriesUseCase(repository);

export class InventoryController {
  public static async createInventory(request: FastifyRequest, reply: FastifyReply) {
    const validatedBody = createInventorySchema.parse(request.body);
    const result = await createInventoryUseCase.execute(validatedBody);
    return reply.status(201).send(successResponse(result, 'Campaña de inventario creada exitosamente.'));
  }

  public static async deleteInventory(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const result = await deleteInventoryUseCase.execute(id);
    return reply.status(200).send(successResponse(null, result.message));
  }

  public static async registerItem(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const validatedBody = registerInventoryItemSchema.parse(request.body);
    const userId = request.user?.id;
    const result = await registerInventoryItemUseCase.execute(id, validatedBody, userId);
    return reply.status(200).send(successResponse(result, 'Ítem de inventario registrado correctamente.'));
  }

  public static async getInventoryById(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const result = await getInventoryByIdUseCase.execute(id);
    return reply.status(200).send(successResponse(result));
  }

  public static async getInventoryItems(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const result = await getInventoryItemsUseCase.execute(id);
    return reply.status(200).send(successResponse(result));
  }

  public static async getAllInventories(request: FastifyRequest, reply: FastifyReply) {
    const validatedQuery = queryInventorySchema.parse(request.query);
    const result = await getAllInventoriesUseCase.execute(validatedQuery);
    return reply.status(200).send({
      success: true,
      message: 'Campañas de inventario obtenidas correctamente.',
      data: result.data,
      pagination: result.pagination,
    });
  }
}

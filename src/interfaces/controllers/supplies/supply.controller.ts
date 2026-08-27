import { FastifyRequest, FastifyReply } from 'fastify';
import { RepositoryFactory } from '../../../infrastructure/database/repository.factory';
import { GetAllSuppliesUseCase } from '../../../application/supplies/get-all-supplies.usecase';
import { GetSupplyByIdUseCase } from '../../../application/supplies/get-supply-by-id.usecase';
import { CreateSupplyUseCase } from '../../../application/supplies/create-supply.usecase';
import { UpdateSupplyUseCase } from '../../../application/supplies/update-supply.usecase';
import { DeleteSupplyUseCase } from '../../../application/supplies/delete-supply.usecase';
import {
  createSupplySchema,
  updateSupplySchema,
  querySupplySchema,
} from '../../validators/supplies/supply.validator';
import { successResponse } from '../../../shared/utils/response.util';

const supplyRepository = RepositoryFactory.getSupplyRepository();
const getAllSuppliesUseCase = new GetAllSuppliesUseCase(supplyRepository);
const getSupplyByIdUseCase = new GetSupplyByIdUseCase(supplyRepository);
const createSupplyUseCase = new CreateSupplyUseCase(supplyRepository);
const updateSupplyUseCase = new UpdateSupplyUseCase(supplyRepository);
const deleteSupplyUseCase = new DeleteSupplyUseCase(supplyRepository);

export class SupplyController {
  public static async getSupplies(request: FastifyRequest, reply: FastifyReply) {
    const validatedQuery = querySupplySchema.parse(request.query);
    const result = await getAllSuppliesUseCase.execute(validatedQuery);
    return reply.status(200).send({
      success: true,
      message: 'Materiales/Suministros obtenidos correctamente.',
      data: result.data,
      pagination: result.pagination,
    });
  }

  public static async getSupplyById(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const supply = await getSupplyByIdUseCase.execute(id);
    return reply.status(200).send(successResponse(supply));
  }

  public static async createSupply(request: FastifyRequest, reply: FastifyReply) {
    const validatedBody = createSupplySchema.parse(request.body);
    const supply = await createSupplyUseCase.execute(validatedBody);
    return reply.status(201).send(successResponse(supply, 'Material/Suministro creado correctamente.'));
  }

  public static async updateSupply(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const validatedBody = updateSupplySchema.parse(request.body);
    const supply = await updateSupplyUseCase.execute(id, validatedBody);
    return reply.status(200).send(successResponse(supply, 'Material/Suministro actualizado correctamente.'));
  }

  public static async deleteSupply(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    await deleteSupplyUseCase.execute(id);
    return reply.status(200).send(successResponse(null, 'Material/Suministro eliminado correctamente.'));
  }
}

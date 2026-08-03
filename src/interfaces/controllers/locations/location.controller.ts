import { FastifyRequest, FastifyReply } from 'fastify';
import { LocationRepository } from '../../../infrastructure/repositories/location.repository';
import { GetLocationsUseCase } from '../../../application/locations/getAll/get-locations.usecase';
import { GetLocationUseCase } from '../../../application/locations/get/get-location.usecase';
import { GetTreeUseCase } from '../../../application/locations/getTree/get-tree.usecase';
import { CreateLocationUseCase } from '../../../application/locations/create/create-location.usecase';
import { UpdateLocationUseCase } from '../../../application/locations/update/update-location.usecase';
import { DeleteLocationUseCase } from '../../../application/locations/delete/delete-location.usecase';
import {
  createLocationSchema,
  updateLocationSchema,
  queryLocationSchema,
} from '../../validators/locations/location.validator';
import { successResponse } from '../../../shared/utils/response.util';

const locationRepository = new LocationRepository();
const getLocationsUseCase = new GetLocationsUseCase(locationRepository);
const getLocationUseCase = new GetLocationUseCase(locationRepository);
const getTreeUseCase = new GetTreeUseCase(locationRepository);
const createLocationUseCase = new CreateLocationUseCase(locationRepository);
const updateLocationUseCase = new UpdateLocationUseCase(locationRepository);
const deleteLocationUseCase = new DeleteLocationUseCase(locationRepository);

export class LocationController {
  public static async getLocations(request: FastifyRequest, reply: FastifyReply) {
    const validatedQuery = queryLocationSchema.parse(request.query);
    const result = await getLocationsUseCase.execute(validatedQuery);
    return reply.status(200).send({
      success: true,
      message: 'Ubicaciones obtenidas correctamente.',
      data: result.data,
      pagination: result.pagination,
    });
  }

  public static async getTree(_request: FastifyRequest, reply: FastifyReply) {
    const tree = await getTreeUseCase.execute();
    return reply.status(200).send(successResponse(tree, 'Árbol de ubicaciones obtenido correctamente.'));
  }

  public static async getLocationById(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const location = await getLocationUseCase.execute(id);
    return reply.status(200).send(successResponse(location));
  }

  public static async createLocation(request: FastifyRequest, reply: FastifyReply) {
    const validatedBody = createLocationSchema.parse(request.body);
    const location = await createLocationUseCase.execute(validatedBody);
    return reply.status(201).send(successResponse(location, 'Ubicación creada exitosamente.'));
  }

  public static async updateLocation(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const validatedBody = updateLocationSchema.parse(request.body);
    const location = await updateLocationUseCase.execute(id, validatedBody);
    return reply.status(200).send(successResponse(location, 'Ubicación actualizada exitosamente.'));
  }

  public static async deleteLocation(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const result = await deleteLocationUseCase.execute(id);
    return reply.status(200).send(successResponse(null, result.message));
  }
}

import { ILocationRepository } from '../../../domain/locations/location.repository.interface';
import { CreateLocationInput } from '../../../interfaces/validators/locations/location.validator';
import { AppError, NotFoundError } from '../../../shared/errors/app-error';
import { logger } from '../../../infrastructure/logger/logger';

export class CreateLocationUseCase {
  constructor(private locationRepository: ILocationRepository) {}

  async execute(input: CreateLocationInput) {
    const parentId = input.parentId || null;

    if (parentId) {
      const parent = await this.locationRepository.findRawById(parentId);
      if (!parent) {
        throw new NotFoundError('Ubicación padre no encontrada.');
      }
    }

    const existing = await this.locationRepository.findByNameAndParent(input.name, parentId);
    if (existing) {
      throw new AppError('Ya existe una ubicación con ese nombre dentro del mismo nivel.', 400);
    }

    const newLocation = await this.locationRepository.create({
      parentId,
      name: input.name,
      description: input.description,
    });

    logger.info({ locationId: newLocation.id, name: newLocation.name }, 'Ubicación creada exitosamente');

    return newLocation;
  }
}

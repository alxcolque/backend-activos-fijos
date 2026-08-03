import { ILocationRepository } from '../../../domain/locations/location.repository.interface';
import { UpdateLocationInput } from '../../../interfaces/validators/locations/location.validator';
import { AppError, NotFoundError } from '../../../shared/errors/app-error';
import { logger } from '../../../infrastructure/logger/logger';

export class UpdateLocationUseCase {
  constructor(private locationRepository: ILocationRepository) {}

  async execute(id: string, input: UpdateLocationInput) {
    const currentLocation = await this.locationRepository.findRawById(id);

    if (!currentLocation) {
      throw new NotFoundError('Ubicación no encontrada.');
    }

    const targetParentId = input.parentId !== undefined ? input.parentId : currentLocation.parentId;

    if (targetParentId === id) {
      throw new AppError('No es posible asignar una ubicación como hija de sí misma.', 400);
    }

    if (targetParentId) {
      const parent = await this.locationRepository.findRawById(targetParentId);
      if (!parent) {
        throw new NotFoundError('Ubicación padre no encontrada.');
      }

      // Check cycle: cannot set parentId to a descendant of current location
      const descendants = await this.locationRepository.getAllDescendantIds(id);
      if (descendants.includes(targetParentId)) {
        throw new AppError(
          'No es posible mover una ubicación dentro de sí misma o de uno de sus descendientes.',
          400,
        );
      }
    }

    const targetName = input.name || currentLocation.name;

    // Check unique name per parent level
    if (targetName !== currentLocation.name || targetParentId !== currentLocation.parentId) {
      const existing = await this.locationRepository.findByNameAndParent(targetName, targetParentId);
      if (existing && existing.id !== id) {
        throw new AppError('Ya existe una ubicación con ese nombre dentro del mismo nivel.', 400);
      }
    }

    const updatedLocation = await this.locationRepository.update(id, input);
    logger.info({ locationId: id }, 'Ubicación actualizada exitosamente');

    return updatedLocation;
  }
}

import { ILocationRepository } from '../../../domain/locations/location.repository.interface';
import { AppError, NotFoundError } from '../../../shared/errors/app-error';
import { logger } from '../../../infrastructure/logger/logger';

export class DeleteLocationUseCase {
  constructor(private locationRepository: ILocationRepository) {}

  async execute(id: string) {
    const location = await this.locationRepository.findRawById(id);

    if (!location) {
      throw new NotFoundError('Ubicación no encontrada.');
    }

    if (location.parentId === null || location.name.toUpperCase() === 'COMIBOL') {
      throw new AppError('La ubicación raíz no puede eliminarse.', 400);
    }

    const hasChildren = await this.locationRepository.existsChildren(id);
    if (hasChildren) {
      throw new AppError('La ubicación tiene sububicaciones asociadas.', 400);
    }

    const hasAssets = await this.locationRepository.existsAssets(id);
    if (hasAssets) {
      throw new AppError('La ubicación posee activos asociados.', 400);
    }

    await this.locationRepository.delete(id);
    logger.info({ locationId: id }, 'Ubicación eliminada exitosamente (Soft Delete)');

    return {
      message: 'Ubicación eliminada correctamente.',
    };
  }
}

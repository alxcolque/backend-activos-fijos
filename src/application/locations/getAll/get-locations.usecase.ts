import {
  ILocationRepository,
  FindAllLocationsOptions,
} from '../../../domain/locations/location.repository.interface';
import { logger } from '../../../infrastructure/logger/logger';

export class GetLocationsUseCase {
  constructor(private locationRepository: ILocationRepository) {}

  async execute(options: FindAllLocationsOptions) {
    logger.info({ options }, 'Consultando ubicaciones con paginación');
    return this.locationRepository.findAll(options);
  }
}

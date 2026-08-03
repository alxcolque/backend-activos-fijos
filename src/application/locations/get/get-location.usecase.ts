import { ILocationRepository } from '../../../domain/locations/location.repository.interface';
import { NotFoundError } from '../../../shared/errors/app-error';

export class GetLocationUseCase {
  constructor(private locationRepository: ILocationRepository) {}

  async execute(id: string) {
    const location = await this.locationRepository.findById(id);

    if (!location) {
      throw new NotFoundError('Ubicación no encontrada.');
    }

    return location;
  }
}

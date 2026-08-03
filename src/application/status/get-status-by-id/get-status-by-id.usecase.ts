import { IStatusRepository } from '../../../domain/status/status.repository.interface';
import { NotFoundError } from '../../../shared/errors/app-error';

export class GetStatusByIdUseCase {
  constructor(private statusRepository: IStatusRepository) {}

  async execute(id: string) {
    const status = await this.statusRepository.findById(id);

    if (!status) {
      throw new NotFoundError('Estado operativo no encontrado.');
    }

    return status;
  }
}

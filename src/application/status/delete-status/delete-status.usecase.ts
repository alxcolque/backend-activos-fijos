import { IStatusRepository } from '../../../domain/status/status.repository.interface';
import { AppError, NotFoundError } from '../../../shared/errors/app-error';
import { logger } from '../../../infrastructure/logger/logger';

export class DeleteStatusUseCase {
  constructor(private statusRepository: IStatusRepository) {}

  async execute(id: string) {
    const status = await this.statusRepository.findById(id);

    if (!status) {
      throw new NotFoundError('Estado operativo no encontrado.');
    }

    const assetCount = await this.statusRepository.countAssets(id);

    if (assetCount > 0) {
      throw new AppError('No se puede eliminar el estado porque tiene activos asociados.', 400);
    }

    await this.statusRepository.delete(id);
    logger.info({ statusId: id }, 'Estado operativo eliminado exitosamente');

    return {
      message: 'Estado operativo eliminado correctamente.',
    };
  }
}

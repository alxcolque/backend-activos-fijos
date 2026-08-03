import { IStatusRepository } from '../../../domain/status/status.repository.interface';
import { UpdateStatusInput } from '../../../interfaces/validators/status/status.validator';
import { AppError, NotFoundError } from '../../../shared/errors/app-error';
import { logger } from '../../../infrastructure/logger/logger';

export class UpdateStatusUseCase {
  constructor(private statusRepository: IStatusRepository) {}

  async execute(id: string, input: UpdateStatusInput) {
    const status = await this.statusRepository.findById(id);

    if (!status) {
      throw new NotFoundError('Estado operativo no encontrado.');
    }

    if (input.name && input.name !== status.name) {
      const existing = await this.statusRepository.findByName(input.name);
      if (existing) {
        throw new AppError('Ya existe un estado operativo registrado con el nombre proporcionado.', 400);
      }
    }

    const updatedStatus = await this.statusRepository.update(id, input);
    logger.info({ statusId: id }, 'Estado operativo actualizado exitosamente');

    return updatedStatus;
  }
}

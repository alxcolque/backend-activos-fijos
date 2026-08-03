import { IStatusRepository } from '../../../domain/status/status.repository.interface';
import { CreateStatusInput } from '../../../interfaces/validators/status/status.validator';
import { AppError } from '../../../shared/errors/app-error';
import { logger } from '../../../infrastructure/logger/logger';

export class CreateStatusUseCase {
  constructor(private statusRepository: IStatusRepository) {}

  async execute(input: CreateStatusInput) {
    const existingStatus = await this.statusRepository.findByName(input.name);

    if (existingStatus) {
      throw new AppError('Ya existe un estado operativo registrado con el nombre proporcionado.', 400);
    }

    const newStatus = await this.statusRepository.create(input);
    logger.info({ statusId: newStatus.id, name: newStatus.name }, 'Estado operativo creado exitosamente');

    return newStatus;
  }
}

import { IStatusRepository } from '../../../domain/status/status.repository.interface';
import { logger } from '../../../infrastructure/logger/logger';

export class GetStatusesUseCase {
  constructor(private statusRepository: IStatusRepository) {}

  async execute(search?: string) {
    logger.info({ search }, 'Consultando estados operativos');
    return this.statusRepository.findAll(search);
  }
}

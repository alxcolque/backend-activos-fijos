import { IMaintenanceRepository } from '../../../domain/maintenances/maintenance.repository.interface';
import { NotFoundError } from '../../../shared/errors/app-error';

export class GetMaintenanceByIdUseCase {
  constructor(private maintenanceRepository: IMaintenanceRepository) {}

  async execute(id: string) {
    const item = await this.maintenanceRepository.findById(id);

    if (!item) {
      throw new NotFoundError('Registro de mantenimiento no encontrado.');
    }

    return item;
  }
}

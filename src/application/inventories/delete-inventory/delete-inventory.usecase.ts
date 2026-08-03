import { IInventoryRepository } from '../../../domain/inventories/inventory.repository.interface';
import { NotFoundError } from '../../../shared/errors/app-error';
import { logger } from '../../../infrastructure/logger/logger';

export class DeleteInventoryUseCase {
  constructor(private inventoryRepository: IInventoryRepository) {}

  async execute(id: string) {
    const inv = await this.inventoryRepository.findById(id);

    if (!inv) {
      throw new NotFoundError('Campaña de inventario no encontrada.');
    }

    await this.inventoryRepository.delete(id);
    logger.info({ inventoryId: id }, 'Campaña de inventario eliminada');

    return {
      message: 'Campaña de inventario eliminada correctamente.',
    };
  }
}

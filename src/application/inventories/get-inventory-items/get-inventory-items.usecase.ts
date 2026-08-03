import { IInventoryRepository } from '../../../domain/inventories/inventory.repository.interface';
import { NotFoundError } from '../../../shared/errors/app-error';

export class GetInventoryItemsUseCase {
  constructor(private inventoryRepository: IInventoryRepository) {}

  async execute(inventoryId: string) {
    const inv = await this.inventoryRepository.findById(inventoryId);

    if (!inv) {
      throw new NotFoundError('Campaña de inventario no encontrada.');
    }

    return this.inventoryRepository.findItemsByInventoryId(inventoryId);
  }
}

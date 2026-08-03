import { IInventoryRepository } from '../../../domain/inventories/inventory.repository.interface';
import { NotFoundError } from '../../../shared/errors/app-error';

export class GetInventoryByIdUseCase {
  constructor(private inventoryRepository: IInventoryRepository) {}

  async execute(id: string) {
    const inv = await this.inventoryRepository.findById(id);

    if (!inv) {
      throw new NotFoundError('Campaña de inventario no encontrada.');
    }

    return inv;
  }
}

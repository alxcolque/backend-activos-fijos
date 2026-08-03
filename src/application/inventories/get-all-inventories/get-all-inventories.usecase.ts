import {
  IInventoryRepository,
  FindAllInventoriesOptions,
} from '../../../domain/inventories/inventory.repository.interface';
import { logger } from '../../../infrastructure/logger/logger';

export class GetAllInventoriesUseCase {
  constructor(private inventoryRepository: IInventoryRepository) {}

  async execute(options: FindAllInventoriesOptions) {
    logger.info({ options }, 'Consulta de campañas de inventario');
    return this.inventoryRepository.findAll(options);
  }
}

import { IInventoryRepository } from '../../../domain/inventories/inventory.repository.interface';
import { CreateInventoryInput } from '../../../interfaces/validators/inventories/inventory.validator';
import { NotFoundError } from '../../../shared/errors/app-error';
import { logger } from '../../../infrastructure/logger/logger';

export class CreateInventoryUseCase {
  constructor(private inventoryRepository: IInventoryRepository) {}

  async execute(input: CreateInventoryInput) {
    const locationExists = await this.inventoryRepository.existsLocation(input.locationId);
    if (!locationExists) {
      throw new NotFoundError('Ubicación no encontrada.');
    }

    const inventoryDate = new Date(input.inventoryDate);

    const inventory = await this.inventoryRepository.create({
      name: input.name,
      inventoryDate,
      locationId: input.locationId,
      observations: input.observations,
    });

    logger.info({ inventoryId: inventory.id, name: inventory.name }, 'Campaña de inventario creada');

    return inventory;
  }
}

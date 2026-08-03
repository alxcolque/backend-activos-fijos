import { IInventoryRepository } from '../../../domain/inventories/inventory.repository.interface';
import { RegisterInventoryItemInput } from '../../../interfaces/validators/inventories/inventory.validator';
import { NotFoundError } from '../../../shared/errors/app-error';
import { logger } from '../../../infrastructure/logger/logger';
import { logAssetHistory } from '../../../shared/utils/audit.util';

export class RegisterInventoryItemUseCase {
  constructor(private inventoryRepository: IInventoryRepository) {}

  async execute(inventoryId: string, input: RegisterInventoryItemInput, userId?: string) {
    const inv = await this.inventoryRepository.findById(inventoryId);
    if (!inv) {
      throw new NotFoundError('Campaña de inventario no encontrada.');
    }

    const assetExists = await this.inventoryRepository.existsAsset(input.assetId);
    if (!assetExists) {
      throw new NotFoundError('Activo no encontrado.');
    }

    const item = await this.inventoryRepository.registerItem({
      inventoryId,
      assetId: input.assetId,
      status: input.status,
      observations: input.observations,
    });

    logger.info(
      { inventoryId, assetId: input.assetId, status: input.status },
      'Ítem de inventario concilado/registrado',
    );

    await logAssetHistory(
      input.assetId,
      userId,
      'INVENTORY_RECONCILE',
      `Conciliado en inventario '${inv.name}' con estado ${input.status || 'FOUND'}`,
    );

    return item;
  }
}

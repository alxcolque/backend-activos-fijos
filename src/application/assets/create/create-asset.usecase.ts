import { IAssetRepository } from '../../../domain/assets/asset.repository.interface';
import { CreateAssetInput } from '../../../interfaces/validators/assets/asset.validator';
import { AppError } from '../../../shared/errors/app-error';
import { logger } from '../../../infrastructure/logger/logger';
import { logAssetHistory } from '../../../shared/utils/audit.util';

export class CreateAssetUseCase {
  constructor(private assetRepository: IAssetRepository) {}

  async execute(input: CreateAssetInput, userId?: string) {
    const existingCode = await this.assetRepository.findByCode(input.code);
    if (existingCode) {
      throw new AppError('El código del activo ya existe.', 400);
    }

    const categoryExists = await this.assetRepository.existsCategory(input.categoryId);
    if (!categoryExists) {
      throw new AppError('La categoría seleccionada no existe.', 400);
    }

    const statusExists = await this.assetRepository.existsStatus(input.statusId);
    if (!statusExists) {
      throw new AppError('El estado seleccionado no existe.', 400);
    }

    const locationExists = await this.assetRepository.existsLocation(input.locationId);
    if (!locationExists) {
      throw new AppError('La ubicación seleccionada no existe.', 400);
    }

    if (input.serialNumber) {
      const existingSerial = await this.assetRepository.findBySerial(input.serialNumber);
      if (existingSerial) {
        throw new AppError('El número de serie ya existe.', 400);
      }
    }

    const purchaseDate = input.purchaseDate ? new Date(input.purchaseDate) : null;

    const newAsset = await this.assetRepository.create({
      code: input.code,
      qrCode: input.code,
      name: input.name,
      description: input.description,
      categoryId: input.categoryId,
      statusId: input.statusId,
      locationId: input.locationId,
      brand: input.brand,
      model: input.model,
      serialNumber: input.serialNumber,
      unit: input.unit || 'PZA',
      quantity: input.quantity,
      purchaseDate,
      purchaseYear: input.purchaseYear,
      purchaseValue: input.purchaseValue,
      residualValue: input.residualValue,
      currentValue: input.currentValue ?? input.purchaseValue,
      observations: input.observations,
      photo: input.photo,
    });

    logger.info({ assetId: newAsset.id, code: newAsset.code }, 'Activo creado exitosamente');
    await logAssetHistory(newAsset.id, userId, 'CREATE', `Activo creado con código ${newAsset.code}`);

    return newAsset;
  }
}

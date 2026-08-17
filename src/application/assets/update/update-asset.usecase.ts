import { IAssetRepository } from '../../../domain/assets/asset.repository.interface';
import { IUploadService } from '../../../domain/uploads/upload.service.interface';
import { UpdateAssetInput } from '../../../interfaces/validators/assets/asset.validator';
import { AppError, NotFoundError } from '../../../shared/errors/app-error';
import { logger } from '../../../infrastructure/logger/logger';
import { logAssetHistory } from '../../../shared/utils/audit.util';

export class UpdateAssetUseCase {
  constructor(
    private assetRepository: IAssetRepository,
    private uploadService?: IUploadService,
  ) {}

  async execute(id: string, input: UpdateAssetInput, userId?: string) {
    const currentAsset = await this.assetRepository.findRawById(id);

    if (!currentAsset) {
      throw new NotFoundError('Activo no encontrado.');
    }

    // Si se modifica o elimina la foto y existía una foto previa en storage, borrarla físicamente
    if (
      input.photo !== undefined &&
      currentAsset.photo &&
      currentAsset.photo !== input.photo &&
      this.uploadService
    ) {
      await this.uploadService.deleteFile(currentAsset.photo);
    }

    if (input.code && input.code !== currentAsset.code) {
      const existingCode = await this.assetRepository.findByCode(input.code);
      if (existingCode && existingCode.id !== id) {
        throw new AppError('El código del activo ya existe.', 400);
      }
    }

    if (input.categoryId && input.categoryId !== currentAsset.categoryId) {
      const categoryExists = await this.assetRepository.existsCategory(input.categoryId);
      if (!categoryExists) {
        throw new AppError('La categoría seleccionada no existe.', 400);
      }
    }

    if (input.statusId && input.statusId !== currentAsset.statusId) {
      const statusExists = await this.assetRepository.existsStatus(input.statusId);
      if (!statusExists) {
        throw new AppError('El estado seleccionado no existe.', 400);
      }
    }

    if (input.locationId && input.locationId !== currentAsset.locationId) {
      const locationExists = await this.assetRepository.existsLocation(input.locationId);
      if (!locationExists) {
        throw new AppError('La ubicación seleccionada no existe.', 400);
      }
    }

    if (input.serialNumber && input.serialNumber !== currentAsset.serialNumber) {
      const existingSerial = await this.assetRepository.findBySerial(input.serialNumber);
      if (existingSerial && existingSerial.id !== id) {
        throw new AppError('El número de serie ya existe.', 400);
      }
    }

    const purchaseDate =
      input.purchaseDate !== undefined
        ? input.purchaseDate
          ? new Date(input.purchaseDate)
          : null
        : undefined;

    const updatedAsset = await this.assetRepository.update(id, {
      ...input,
      purchaseDate,
    });

    logger.info({ assetId: id }, 'Activo actualizado exitosamente');
    await logAssetHistory(id, userId, 'UPDATE', `Activo actualizado`);

    return updatedAsset;
  }
}

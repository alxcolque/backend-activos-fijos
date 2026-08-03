import { ICategoryRepository } from '../../../domain/category/category.repository.interface';
import { AppError, NotFoundError } from '../../../shared/errors/app-error';
import { logger } from '../../../infrastructure/logger/logger';

export class DeleteCategoryUseCase {
  constructor(private categoryRepository: ICategoryRepository) {}

  async execute(id: string) {
    const category = await this.categoryRepository.findById(id);

    if (!category) {
      throw new NotFoundError('Categoría no encontrada.');
    }

    const assetCount = await this.categoryRepository.countAssets(id);

    if (assetCount > 0) {
      throw new AppError('No se puede eliminar la categoría porque tiene activos asociados.', 400);
    }

    await this.categoryRepository.delete(id);
    logger.info({ categoryId: id }, 'Categoría eliminada exitosamente');

    return {
      message: 'Categoría eliminada correctamente.',
    };
  }
}

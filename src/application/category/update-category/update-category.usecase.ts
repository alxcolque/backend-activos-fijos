import { ICategoryRepository } from '../../../domain/category/category.repository.interface';
import { UpdateCategoryInput } from '../../../interfaces/validators/category/category.validator';
import { AppError, NotFoundError } from '../../../shared/errors/app-error';
import { logger } from '../../../infrastructure/logger/logger';

export class UpdateCategoryUseCase {
  constructor(private categoryRepository: ICategoryRepository) {}

  async execute(id: string, input: UpdateCategoryInput) {
    const category = await this.categoryRepository.findById(id);

    if (!category) {
      throw new NotFoundError('Categoría no encontrada.');
    }

    if (input.name && input.name !== category.name) {
      const existing = await this.categoryRepository.findByName(input.name);
      if (existing) {
        throw new AppError('Ya existe una categoría registrada con el nombre proporcionado.', 400);
      }
    }

    const updatedCategory = await this.categoryRepository.update(id, input);
    logger.info({ categoryId: id }, 'Categoría actualizada exitosamente');

    return updatedCategory;
  }
}

import { ICategoryRepository } from '../../../domain/category/category.repository.interface';
import { CreateCategoryInput } from '../../../interfaces/validators/category/category.validator';
import { AppError } from '../../../shared/errors/app-error';
import { logger } from '../../../infrastructure/logger/logger';

export class CreateCategoryUseCase {
  constructor(private categoryRepository: ICategoryRepository) {}

  async execute(input: CreateCategoryInput) {
    const existingCategory = await this.categoryRepository.findByName(input.name);

    if (existingCategory) {
      throw new AppError('Ya existe una categoría registrada con el nombre proporcionado.', 400);
    }

    const newCategory = await this.categoryRepository.create(input);
    logger.info({ categoryId: newCategory.id, name: newCategory.name }, 'Categoría creada exitosamente');

    return newCategory;
  }
}

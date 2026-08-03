import { ICategoryRepository } from '../../../domain/category/category.repository.interface';
import { logger } from '../../../infrastructure/logger/logger';

export class GetCategoriesUseCase {
  constructor(private categoryRepository: ICategoryRepository) {}

  async execute(search?: string) {
    logger.info({ search }, 'Consultando categorías');
    return this.categoryRepository.findAll(search);
  }
}

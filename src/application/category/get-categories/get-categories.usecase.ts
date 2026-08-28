import { ICategoryRepository } from '../../../domain/category/category.repository.interface';
import { logger } from '../../../infrastructure/logger/logger';

export class GetCategoriesUseCase {
  constructor(private categoryRepository: ICategoryRepository) {}

  async execute(search?: string, type?: 'ASSET' | 'SUPPLY') {
    logger.info({ search, type }, 'Consultando categorías');
    return this.categoryRepository.findAll(search, type);
  }
}

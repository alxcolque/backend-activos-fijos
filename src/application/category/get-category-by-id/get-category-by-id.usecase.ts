import { ICategoryRepository } from '../../../domain/category/category.repository.interface';
import { NotFoundError } from '../../../shared/errors/app-error';

export class GetCategoryByIdUseCase {
  constructor(private categoryRepository: ICategoryRepository) {}

  async execute(id: string) {
    const category = await this.categoryRepository.findById(id);

    if (!category) {
      throw new NotFoundError('Categoría no encontrada.');
    }

    return category;
  }
}

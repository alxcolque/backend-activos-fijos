import { FastifyRequest, FastifyReply } from 'fastify';
import { RepositoryFactory } from '../../infrastructure/database/repository.factory';
import { GetCategoriesUseCase } from '../../application/category/get-categories/get-categories.usecase';
import { GetCategoryByIdUseCase } from '../../application/category/get-category-by-id/get-category-by-id.usecase';
import { CreateCategoryUseCase } from '../../application/category/create-category/create-category.usecase';
import { UpdateCategoryUseCase } from '../../application/category/update-category/update-category.usecase';
import { DeleteCategoryUseCase } from '../../application/category/delete-category/delete-category.usecase';
import {
  createCategorySchema,
  updateCategorySchema,
} from '../validators/category/category.validator';
import { successResponse } from '../../shared/utils/response.util';

const categoryRepository = RepositoryFactory.getCategoryRepository();
const getCategoriesUseCase = new GetCategoriesUseCase(categoryRepository);
const getCategoryByIdUseCase = new GetCategoryByIdUseCase(categoryRepository);
const createCategoryUseCase = new CreateCategoryUseCase(categoryRepository);
const updateCategoryUseCase = new UpdateCategoryUseCase(categoryRepository);
const deleteCategoryUseCase = new DeleteCategoryUseCase(categoryRepository);

export class CategoryController {
  public static async getCategories(request: FastifyRequest, reply: FastifyReply) {
    const { search, type } = request.query as { search?: string; type?: 'ASSET' | 'SUPPLY' };
    const categories = await getCategoriesUseCase.execute(search, type);
    return reply.status(200).send(successResponse(categories, 'Categorías obtenidas correctamente.'));
  }

  public static async getCategoryById(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const category = await getCategoryByIdUseCase.execute(id);
    return reply.status(200).send(successResponse(category));
  }

  public static async createCategory(request: FastifyRequest, reply: FastifyReply) {
    const validatedBody = createCategorySchema.parse(request.body);
    const category = await createCategoryUseCase.execute(validatedBody);
    return reply.status(201).send(successResponse(category, 'Categoría creada exitosamente.'));
  }

  public static async updateCategory(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const validatedBody = updateCategorySchema.parse(request.body);
    const category = await updateCategoryUseCase.execute(id, validatedBody);
    return reply.status(200).send(successResponse(category, 'Categoría actualizada exitosamente.'));
  }

  public static async deleteCategory(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const result = await deleteCategoryUseCase.execute(id);
    return reply.status(200).send(successResponse(null, result.message));
  }
}

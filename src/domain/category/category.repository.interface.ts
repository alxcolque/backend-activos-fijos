import { AssetCategory } from './category.entity';

export interface CategoryWithCount extends AssetCategory {
  totalAssets?: number;
}

export interface ICategoryRepository {
  findAll(search?: string): Promise<CategoryWithCount[]>;
  findById(id: string): Promise<CategoryWithCount | null>;
  findByName(name: string): Promise<AssetCategory | null>;
  create(data: { name: string; description?: string; usefulLife?: number }): Promise<AssetCategory>;
  update(id: string, data: { name?: string; description?: string; usefulLife?: number }): Promise<AssetCategory>;
  delete(id: string): Promise<void>;
  countAssets(categoryId: string): Promise<number>;
}

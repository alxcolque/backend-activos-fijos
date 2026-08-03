import { AssetCategory } from '@prisma/client';

export interface CategoryWithCount extends AssetCategory {
  totalAssets?: number;
}

export interface ICategoryRepository {
  findAll(search?: string): Promise<CategoryWithCount[]>;
  findById(id: string): Promise<CategoryWithCount | null>;
  findByName(name: string): Promise<AssetCategory | null>;
  create(data: { name: string; description?: string }): Promise<AssetCategory>;
  update(id: string, data: { name?: string; description?: string }): Promise<AssetCategory>;
  delete(id: string): Promise<void>;
  countAssets(categoryId: string): Promise<number>;
}

import { AssetCategory } from './category.entity';

export interface CategoryWithCount extends AssetCategory {
  totalAssets?: number;
}

export interface ICategoryRepository {
  findAll(search?: string, type?: 'ASSET' | 'SUPPLY'): Promise<CategoryWithCount[]>;
  findById(id: string): Promise<CategoryWithCount | null>;
  findByName(name: string): Promise<AssetCategory | null>;
  create(data: { name: string; description?: string; type?: 'ASSET' | 'SUPPLY'; usefulLife?: number }): Promise<AssetCategory>;
  update(id: string, data: { name?: string; description?: string; type?: 'ASSET' | 'SUPPLY'; usefulLife?: number }): Promise<AssetCategory>;
  delete(id: string): Promise<void>;
  countAssets(categoryId: string): Promise<number>;
}

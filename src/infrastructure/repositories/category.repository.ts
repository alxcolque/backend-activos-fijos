import { AssetCategory } from '../../domain/category/category.entity';
import { prisma } from '../database/prisma.service';
import {
  ICategoryRepository,
  CategoryWithCount,
} from '../../domain/category/category.repository.interface';

export class CategoryRepository implements ICategoryRepository {
  async findAll(search?: string, type?: 'ASSET' | 'SUPPLY'): Promise<CategoryWithCount[]> {
    const whereConditions: any[] = [];

    if (search) {
      whereConditions.push({
        OR: [
          { name: { contains: search } },
          { description: { contains: search } },
        ],
      });
    }

    if (type) {
      whereConditions.push({ type });
    }

    const whereCondition = whereConditions.length > 0 ? { AND: whereConditions } : {};

    const categories = await prisma.assetCategory.findMany({
      where: whereCondition,
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        description: true,
        type: true,
        usefulLife: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            assets: {
              where: { deletedAt: null },
            },
          },
        },
      },
    });

    return categories.map((cat: any) => ({
      id: cat.id,
      name: cat.name,
      description: cat.description,
      type: (cat.type || 'ASSET') as 'ASSET' | 'SUPPLY',
      usefulLife: cat.usefulLife,
      createdAt: cat.createdAt,
      updatedAt: cat.updatedAt,
      totalAssets: cat._count.assets,
    }));
  }

  async findById(id: string): Promise<CategoryWithCount | null> {
    const cat = await prisma.assetCategory.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        description: true,
        type: true,
        usefulLife: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            assets: {
              where: { deletedAt: null },
            },
          },
        },
      },
    });

    if (!cat) return null;

    return {
      id: cat.id,
      name: cat.name,
      description: cat.description,
      type: (cat.type || 'ASSET') as 'ASSET' | 'SUPPLY',
      usefulLife: cat.usefulLife,
      createdAt: cat.createdAt,
      updatedAt: cat.updatedAt,
      totalAssets: cat._count.assets,
    };
  }

  async findByName(name: string): Promise<AssetCategory | null> {
    const cat = await prisma.assetCategory.findUnique({
      where: { name },
    });
    if (!cat) return null;
    return {
      ...cat,
      type: (cat.type || 'ASSET') as 'ASSET' | 'SUPPLY',
    };
  }

  async create(data: { name: string; description?: string; type?: 'ASSET' | 'SUPPLY'; usefulLife?: number }): Promise<AssetCategory> {
    const cat = await prisma.assetCategory.create({
      data: {
        name: data.name,
        description: data.description || null,
        type: data.type || 'ASSET',
        usefulLife: data.usefulLife ?? 0,
      },
    });
    return {
      ...cat,
      type: (cat.type || 'ASSET') as 'ASSET' | 'SUPPLY',
    };
  }

  async update(
    id: string,
    data: { name?: string; description?: string; type?: 'ASSET' | 'SUPPLY'; usefulLife?: number },
  ): Promise<AssetCategory> {
    const cat = await prisma.assetCategory.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.type !== undefined && { type: data.type }),
        ...(data.usefulLife !== undefined && { usefulLife: data.usefulLife }),
      },
    });
    return {
      ...cat,
      type: (cat.type || 'ASSET') as 'ASSET' | 'SUPPLY',
    };
  }

  async delete(id: string): Promise<void> {
    await prisma.assetCategory.delete({
      where: { id },
    });
  }

  async countAssets(categoryId: string): Promise<number> {
    return prisma.asset.count({
      where: {
        categoryId,
        deletedAt: null,
      },
    });
  }
}

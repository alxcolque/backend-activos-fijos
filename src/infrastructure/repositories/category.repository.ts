import { AssetCategory } from '@prisma/client';
import { prisma } from '../database/prisma.service';
import {
  ICategoryRepository,
  CategoryWithCount,
} from '../../domain/category/category.repository.interface';

export class CategoryRepository implements ICategoryRepository {
  async findAll(search?: string): Promise<CategoryWithCount[]> {
    const whereCondition = search
      ? {
          OR: [
            { name: { contains: search } },
            { description: { contains: search } },
          ],
        }
      : {};

    const categories = await prisma.assetCategory.findMany({
      where: whereCondition,
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        description: true,
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

    return categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      description: cat.description,
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
      createdAt: cat.createdAt,
      updatedAt: cat.updatedAt,
      totalAssets: cat._count.assets,
    };
  }

  async findByName(name: string): Promise<AssetCategory | null> {
    return prisma.assetCategory.findUnique({
      where: { name },
    });
  }

  async create(data: { name: string; description?: string }): Promise<AssetCategory> {
    return prisma.assetCategory.create({
      data,
    });
  }

  async update(
    id: string,
    data: { name?: string; description?: string },
  ): Promise<AssetCategory> {
    return prisma.assetCategory.update({
      where: { id },
      data,
    });
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

import { AssetStatus } from '../../domain/status/status.entity';
import { prisma } from '../database/prisma.service';
import {
  IStatusRepository,
  StatusWithCount,
} from '../../domain/status/status.repository.interface';

export class StatusRepository implements IStatusRepository {
  async findAll(search?: string): Promise<StatusWithCount[]> {
    const whereCondition = search
      ? {
          OR: [
            { name: { contains: search } },
            { description: { contains: search } },
          ],
        }
      : {};

    const statuses = await prisma.assetStatus.findMany({
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

    return statuses.map((st: any) => ({
      id: st.id,
      name: st.name,
      description: st.description,
      createdAt: st.createdAt,
      updatedAt: st.updatedAt,
      totalAssets: st._count.assets,
    }));
  }

  async findById(id: string): Promise<StatusWithCount | null> {
    const st = await prisma.assetStatus.findUnique({
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

    if (!st) return null;

    return {
      id: st.id,
      name: st.name,
      description: st.description,
      createdAt: st.createdAt,
      updatedAt: st.updatedAt,
      totalAssets: st._count.assets,
    };
  }

  async findByName(name: string): Promise<AssetStatus | null> {
    return prisma.assetStatus.findUnique({
      where: { name },
    });
  }

  async create(data: { name: string; description?: string }): Promise<AssetStatus> {
    return prisma.assetStatus.create({
      data,
    });
  }

  async update(
    id: string,
    data: { name?: string; description?: string },
  ): Promise<AssetStatus> {
    return prisma.assetStatus.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.assetStatus.delete({
      where: { id },
    });
  }

  async countAssets(statusId: string): Promise<number> {
    return prisma.asset.count({
      where: {
        statusId,
        deletedAt: null,
      },
    });
  }
}

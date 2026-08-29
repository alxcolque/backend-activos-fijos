import { Location } from '../../domain/locations/location.entity';
import { prisma } from '../database/prisma.service';
import {
  ILocationRepository,
  LocationWithCount,
  FindAllLocationsOptions,
  PaginatedLocations,
} from '../../domain/locations/location.repository.interface';

export class LocationRepository implements ILocationRepository {
  async findAll(options: FindAllLocationsOptions): Promise<PaginatedLocations> {
    const page = options.page && options.page > 0 ? options.page : 1;
    const limit = options.limit && options.limit > 0 ? options.limit : 20;
    const skip = (page - 1) * limit;

    const whereCondition: any = {
      deletedAt: null,
    };

    if (options.search) {
      whereCondition.OR = [
        { name: { contains: options.search } },
        { description: { contains: options.search } },
      ];
    }

    const sortBy = options.sortBy || 'name';
    const sortOrder = options.sortOrder || 'asc';

    const [total, locations] = await Promise.all([
      prisma.location.count({ where: whereCondition }),
      prisma.location.findMany({
        where: whereCondition,
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
        select: {
          id: true,
          parentId: true,
          name: true,
          description: true,
          createdAt: true,
          updatedAt: true,
          deletedAt: true,
          _count: {
            select: {
              assets: { where: { deletedAt: null } },
              children: { where: { deletedAt: null } },
            },
          },
        },
      }),
    ]);

    const formattedData: LocationWithCount[] = locations.map((loc: any) => ({
      id: loc.id,
      parentId: loc.parentId,
      name: loc.name,
      description: loc.description,
      createdAt: loc.createdAt,
      updatedAt: loc.updatedAt,
      deletedAt: loc.deletedAt,
      totalAssets: loc._count.assets,
      totalChildren: loc._count.children,
    }));

    return {
      data: formattedData,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async findById(id: string): Promise<LocationWithCount | null> {
    const loc = await prisma.location.findFirst({
      where: { id, deletedAt: null },
      select: {
        id: true,
        parentId: true,
        name: true,
        description: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
        _count: {
          select: {
            assets: { where: { deletedAt: null } },
            children: { where: { deletedAt: null } },
          },
        },
      },
    });

    if (!loc) return null;

    return {
      id: loc.id,
      parentId: loc.parentId,
      name: loc.name,
      description: loc.description,
      createdAt: loc.createdAt,
      updatedAt: loc.updatedAt,
      deletedAt: loc.deletedAt,
      totalAssets: loc._count.assets,
      totalChildren: loc._count.children,
    };
  }

  async findRawById(id: string): Promise<Location | null> {
    return prisma.location.findFirst({
      where: { id, deletedAt: null },
    });
  }

  async findByNameAndParent(name: string, parentId: string | null): Promise<Location | null> {
    return prisma.location.findFirst({
      where: {
        name,
        parentId: parentId || null,
        deletedAt: null,
      },
    });
  }

  async findAllRaw(): Promise<Location[]> {
    return prisma.location.findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' },
    });
  }

  async create(data: { parentId?: string | null; name: string; description?: string; code?: string }): Promise<Location> {
    return prisma.location.create({
      data: {
        code: data.code || `LOC-${Date.now().toString(36).toUpperCase()}`,
        parentId: data.parentId || null,
        name: data.name,
        description: data.description || null,
      } as any,
    });
  }

  async update(
    id: string,
    data: { parentId?: string | null; name?: string; description?: string },
  ): Promise<Location> {
    return prisma.location.update({
      where: { id },
      data: {
        ...(data.parentId !== undefined && { parentId: data.parentId }),
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
      },
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.location.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async existsChildren(id: string): Promise<boolean> {
    const count = await prisma.location.count({
      where: {
        parentId: id,
        deletedAt: null,
      },
    });
    return count > 0;
  }

  async existsAssets(id: string): Promise<boolean> {
    const count = await prisma.asset.count({
      where: {
        locationId: id,
        deletedAt: null,
      },
    });
    return count > 0;
  }

  async getAllDescendantIds(id: string): Promise<string[]> {
    const allLocations = await this.findAllRaw();
    const descendants: string[] = [];

    const findChildren = (currentId: string) => {
      const children = allLocations.filter((l) => l.parentId === currentId);
      for (const child of children) {
        descendants.push(child.id);
        findChildren(child.id);
      }
    };

    findChildren(id);
    return descendants;
  }
}

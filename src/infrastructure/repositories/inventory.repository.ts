import { Inventory, InventoryItem } from '../../domain/inventories/inventory.entity';
import { InventoryStatus } from '../../domain/enums/inventory-status.enum';
import { prisma } from '../database/prisma.service';
import {
  IInventoryRepository,
  InventoryDetail,
  InventoryItemDetail,
  FindAllInventoriesOptions,
  PaginatedInventories,
  CreateInventoryDto,
  RegisterInventoryItemDto,
} from '../../domain/inventories/inventory.repository.interface';

export class InventoryRepository implements IInventoryRepository {
  async findAll(options: FindAllInventoriesOptions): Promise<PaginatedInventories> {
    const page = options.page && options.page > 0 ? options.page : 1;
    const limit = options.limit && options.limit > 0 ? options.limit : 20;
    const skip = (page - 1) * limit;

    const whereCondition: any = {};

    if (options.locationId) {
      whereCondition.locationId = options.locationId;
    }

    if (options.search) {
      whereCondition.OR = [
        { name: { contains: options.search } },
        { observations: { contains: options.search } },
        { location: { name: { contains: options.search } } },
      ];
    }

    const [total, items] = await Promise.all([
      prisma.inventory.count({ where: whereCondition }),
      prisma.inventory.findMany({
        where: whereCondition,
        orderBy: { inventoryDate: 'desc' },
        skip,
        take: limit,
        include: {
          location: {
            select: { id: true, name: true },
          },
          _count: {
            select: { items: true },
          },
        },
      }),
    ]);

    const formattedData: InventoryDetail[] = items.map((inv) => ({
      id: inv.id,
      name: inv.name,
      inventoryDate: inv.inventoryDate,
      locationId: inv.locationId,
      observations: inv.observations,
      createdAt: inv.createdAt,
      updatedAt: inv.updatedAt,
      location: inv.location,
      stats: {
        totalItems: inv._count.items,
        found: 0,
        notFound: 0,
        damaged: 0,
      },
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

  async findById(id: string): Promise<InventoryDetail | null> {
    const inv = await prisma.inventory.findUnique({
      where: { id },
      include: {
        location: { select: { id: true, name: true } },
        items: {
          select: { status: true },
        },
      },
    });

    if (!inv) {
      return null;
    }

    const found = inv.items.filter((i) => i.status === 'FOUND').length;
    const notFound = inv.items.filter((i) => i.status === 'NOT_FOUND').length;
    const damaged = inv.items.filter((i) => i.status === 'DAMAGED').length;

    return {
      id: inv.id,
      name: inv.name,
      inventoryDate: inv.inventoryDate,
      locationId: inv.locationId,
      observations: inv.observations,
      createdAt: inv.createdAt,
      updatedAt: inv.updatedAt,
      location: inv.location,
      stats: {
        totalItems: inv.items.length,
        found,
        notFound,
        damaged,
      },
    };
  }

  async findItemByInventoryAndAsset(inventoryId: string, assetId: string): Promise<InventoryItem | null> {
    const item = await prisma.inventoryItem.findFirst({
      where: { inventoryId, assetId },
    });
    return item as unknown as InventoryItem | null;
  }

  async findItemsByInventoryId(inventoryId: string): Promise<InventoryItemDetail[]> {
    const items = await prisma.inventoryItem.findMany({
      where: { inventoryId },
      orderBy: { createdAt: 'desc' },
      include: {
        asset: {
          select: {
            id: true,
            code: true,
            name: true,
            category: { select: { id: true, name: true } },
            status: { select: { id: true, name: true } },
          },
        },
      },
    });

    return items as unknown as InventoryItemDetail[];
  }

  async create(data: CreateInventoryDto): Promise<Inventory> {
    const item = await prisma.inventory.create({
      data: {
        name: data.name,
        inventoryDate: data.inventoryDate,
        locationId: data.locationId,
        observations: data.observations || null,
      },
    });
    return item as unknown as Inventory;
  }

  async registerItem(data: RegisterInventoryItemDto): Promise<InventoryItem> {
    const existing = await this.findItemByInventoryAndAsset(data.inventoryId, data.assetId);

    if (existing) {
      const updated = await prisma.inventoryItem.update({
        where: { id: existing.id },
        data: {
          status: (data.status as any) || 'FOUND',
          observations: data.observations || null,
        },
      });
      return updated as unknown as InventoryItem;
    }

    const created = await prisma.inventoryItem.create({
      data: {
        inventoryId: data.inventoryId,
        assetId: data.assetId,
        status: (data.status as any) || 'FOUND',
        observations: data.observations || null,
      },
    });
    return created as unknown as InventoryItem;
  }

  async delete(id: string): Promise<void> {
    await prisma.inventory.delete({
      where: { id },
    });
  }

  async existsLocation(locationId: string): Promise<boolean> {
    const count = await prisma.location.count({ where: { id: locationId, deletedAt: null } });
    return count > 0;
  }

  async existsAsset(assetId: string): Promise<boolean> {
    const count = await prisma.asset.count({ where: { id: assetId, deletedAt: null } });
    return count > 0;
  }
}

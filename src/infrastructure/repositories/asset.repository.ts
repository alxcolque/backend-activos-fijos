import { Asset } from '@prisma/client';
import { prisma } from '../database/prisma.service';
import {
  IAssetRepository,
  AssetListItem,
  AssetDetail,
  FindAllAssetsOptions,
  PaginatedAssets,
  CreateAssetDto,
  UpdateAssetDto,
} from '../../domain/assets/asset.repository.interface';

export class AssetRepository implements IAssetRepository {
  async findAll(options: FindAllAssetsOptions): Promise<PaginatedAssets> {
    const page = options.page && options.page > 0 ? options.page : 1;
    const limit = options.limit && options.limit > 0 ? options.limit : 20;
    const skip = (page - 1) * limit;

    const whereCondition: any = {
      deletedAt: null,
    };

    if (options.category) {
      whereCondition.categoryId = options.category;
    }

    if (options.status) {
      whereCondition.statusId = options.status;
    }

    if (options.location) {
      whereCondition.locationId = options.location;
    }

    if (options.search) {
      whereCondition.OR = [
        { code: { contains: options.search } },
        { name: { contains: options.search } },
        { description: { contains: options.search } },
        { brand: { contains: options.search } },
        { model: { contains: options.search } },
        { serialNumber: { contains: options.search } },
      ];
    }

    const sortBy = options.sortBy || 'name';
    const sortOrder = options.sortOrder || 'asc';

    const [total, assets] = await Promise.all([
      prisma.asset.count({ where: whereCondition }),
      prisma.asset.findMany({
        where: whereCondition,
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
        select: {
          id: true,
          code: true,
          qrCode: true,
          name: true,
          brand: true,
          model: true,
          serialNumber: true,
          purchaseValue: true,
          currentValue: true,
          createdAt: true,
          category: {
            select: { id: true, name: true, usefulLife: true },
          },
          status: {
            select: { id: true, name: true },
          },
          location: {
            select: { id: true, name: true },
          },
        },
      }),
    ]);

    const formattedData: AssetListItem[] = assets.map((a) => ({
      id: a.id,
      code: a.code,
      qrCode: a.qrCode,
      name: a.name,
      category: a.category,
      status: a.status,
      location: a.location,
      brand: a.brand,
      model: a.model,
      serialNumber: a.serialNumber,
      purchaseValue: a.purchaseValue ? Number(a.purchaseValue) : null,
      currentValue: a.currentValue ? Number(a.currentValue) : null,
      createdAt: a.createdAt,
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

  async findById(id: string): Promise<AssetDetail | null> {
    const asset = await prisma.asset.findFirst({
      where: { id, deletedAt: null },
      include: {
        category: { select: { id: true, name: true, usefulLife: true } },
        status: { select: { id: true, name: true } },
        location: { select: { id: true, name: true } },
      },
    });

    return asset as unknown as AssetDetail | null;
  }

  async findRawById(id: string): Promise<Asset | null> {
    return prisma.asset.findFirst({
      where: { id, deletedAt: null },
    });
  }

  async findByCode(code: string): Promise<AssetDetail | null> {
    const asset = await prisma.asset.findFirst({
      where: { code, deletedAt: null },
      include: {
        category: { select: { id: true, name: true, usefulLife: true } },
        status: { select: { id: true, name: true } },
        location: { select: { id: true, name: true } },
      },
    });

    return asset as unknown as AssetDetail | null;
  }

  async findByQr(qrCode: string): Promise<AssetDetail | null> {
    const asset = await prisma.asset.findFirst({
      where: { qrCode, deletedAt: null },
      include: {
        category: { select: { id: true, name: true, usefulLife: true } },
        status: { select: { id: true, name: true } },
        location: { select: { id: true, name: true } },
      },
    });

    return asset as unknown as AssetDetail | null;
  }

  async findBySerial(serialNumber: string): Promise<Asset | null> {
    return prisma.asset.findFirst({
      where: { serialNumber, deletedAt: null },
    });
  }

  async create(data: CreateAssetDto): Promise<Asset> {
    const qrCode = data.qrCode || data.code;

    return prisma.asset.create({
      data: {
        code: data.code,
        qrCode,
        name: data.name,
        description: data.description || null,
        categoryId: data.categoryId,
        statusId: data.statusId,
        locationId: data.locationId,
        brand: data.brand || null,
        model: data.model || null,
        serialNumber: data.serialNumber || null,
        unit: data.unit || 'PZA',
        quantity: data.quantity ?? 1,
        purchaseDate: data.purchaseDate || null,
        purchaseYear: data.purchaseYear || null,
        purchaseValue: data.purchaseValue !== undefined ? data.purchaseValue : null,
        residualValue: data.residualValue !== undefined ? data.residualValue : null,
        currentValue:
          data.currentValue !== undefined
            ? data.currentValue
            : data.purchaseValue !== undefined
              ? data.purchaseValue
              : null,
        observations: data.observations || null,
        photo: data.photo || null,
      },
    });
  }

  async update(id: string, data: UpdateAssetDto): Promise<Asset> {
    return prisma.asset.update({
      where: { id },
      data: {
        ...(data.code !== undefined && { code: data.code, qrCode: data.code }),
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.categoryId !== undefined && { categoryId: data.categoryId }),
        ...(data.statusId !== undefined && { statusId: data.statusId }),
        ...(data.locationId !== undefined && { locationId: data.locationId }),
        ...(data.brand !== undefined && { brand: data.brand }),
        ...(data.model !== undefined && { model: data.model }),
        ...(data.serialNumber !== undefined && { serialNumber: data.serialNumber }),
        ...(data.unit !== undefined && { unit: data.unit }),
        ...(data.quantity !== undefined && { quantity: data.quantity }),
        ...(data.purchaseDate !== undefined && { purchaseDate: data.purchaseDate }),
        ...(data.purchaseYear !== undefined && { purchaseYear: data.purchaseYear }),
        ...(data.purchaseValue !== undefined && { purchaseValue: data.purchaseValue }),
        ...(data.residualValue !== undefined && { residualValue: data.residualValue }),
        ...(data.currentValue !== undefined && { currentValue: data.currentValue }),
        ...(data.observations !== undefined && { observations: data.observations }),
        ...(data.photo !== undefined && { photo: data.photo }),
      },
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.asset.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async existsCategory(categoryId: string): Promise<boolean> {
    const count = await prisma.assetCategory.count({ where: { id: categoryId } });
    return count > 0;
  }

  async existsStatus(statusId: string): Promise<boolean> {
    const count = await prisma.assetStatus.count({ where: { id: statusId } });
    return count > 0;
  }

  async existsLocation(locationId: string): Promise<boolean> {
    const count = await prisma.location.count({ where: { id: locationId, deletedAt: null } });
    return count > 0;
  }

  async hasRelatedData(assetId: string): Promise<boolean> {
    const [projectsCount, assignmentsCount, documentsCount, maintenancesCount, itemsCount] =
      await Promise.all([
        prisma.assetProject.count({ where: { assetId } }),
        prisma.assetAssignment.count({ where: { assetId } }),
        prisma.assetDocument.count({ where: { assetId } }),
        prisma.assetMaintenance.count({ where: { assetId } }),
        prisma.inventoryItem.count({ where: { assetId } }),
      ]);

    return (
      projectsCount > 0 ||
      assignmentsCount > 0 ||
      documentsCount > 0 ||
      maintenancesCount > 0 ||
      itemsCount > 0
    );
  }
}

import { Asset } from '../../domain/assets/asset.entity';
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

const ASSET_YEAR = 360;

export function dias360(fechaInicio: Date | string, fechaFin: Date | string = new Date()): number {
  const inicio = new Date(fechaInicio);
  const fin = new Date(fechaFin);

  if (isNaN(inicio.getTime()) || isNaN(fin.getTime()) || fin <= inicio) {
    return 0;
  }

  const isISOInicio = typeof fechaInicio === 'string' && (fechaInicio.includes('T') || fechaInicio.includes('Z'));
  const diaInicio = Math.min(isISOInicio ? inicio.getUTCDate() : inicio.getDate(), 30);
  const mesInicio = isISOInicio ? inicio.getUTCMonth() : inicio.getMonth();
  const anioInicio = isISOInicio ? inicio.getUTCFullYear() : inicio.getFullYear();

  const isISOFin = typeof fechaFin === 'string' && (fechaFin.includes('T') || fechaFin.includes('Z'));
  const diaFin = Math.min(isISOFin ? fin.getUTCDate() : fin.getDate(), 30);
  const mesFin = isISOFin ? fin.getUTCMonth() : fin.getMonth();
  const anioFin = isISOFin ? fin.getUTCFullYear() : fin.getFullYear();

  const resultado =
    (anioFin - anioInicio) * 360 +
    (mesFin - mesInicio) * 30 +
    (diaFin - diaInicio);

  return Math.max(0, resultado);
}

export function calculateFinancials(
  purchaseValueNum: number | null | undefined,
  purchaseDateVal: Date | string | null | undefined,
  usefulLifeVal: number | null | undefined,
  currentDateVal: Date | string | null | undefined = new Date(),
) {
  const purchaseValue = purchaseValueNum ? Number(purchaseValueNum) : 0;
  const avu = usefulLifeVal && Number(usefulLifeVal) > 0 ? Number(usefulLifeVal) : 5;

  // dpd = 100 / (avu * ASSET_YEAR)
  const dpd = 100 / (avu * ASSET_YEAR);

  // dep = (dpd) * ASSET_YEAR (monto de depreciación anual sobre valor de compra)
  const dep = (100 / (ASSET_YEAR * avu)) * ASSET_YEAR;

  // ndu con método dias360
  const ndu = purchaseDateVal ? dias360(purchaseDateVal, currentDateVal || new Date()) : 0;

  // au = ndu / ASSET_YEAR
  const au = ndu / ASSET_YEAR;

  // si (au >= avu) entonces depac = purchaseValue - 1 sino depac = ((dpd * purchaseValue)/100) * ndu
  let depac = 0;
  if (purchaseValue > 0) {
    if (au >= avu) {
      depac = purchaseValue - 1;
    } else {
      depac = Math.min(purchaseValue - 1, ((dpd * purchaseValue) / 100) * ndu);
    }
  }

  // balance = purchaseValue - depac
  const balance = Math.max(0, purchaseValue - depac);

  return {
    dep: Number(dep.toFixed(2)),
    depac: Number(depac.toFixed(2)),
    balance: Number(balance.toFixed(2)),
  };
}

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
          quantity: true,
          unit: true,
          brand: true,
          model: true,
          serialNumber: true,
          purchaseDate: true,
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

    const formattedData: AssetListItem[] = assets.map((a: any) => {
      const pVal = a.purchaseValue ? Number(a.purchaseValue) : 0;
      const uLife = a.category?.usefulLife ?? 5;
      const fin = calculateFinancials(pVal, a.purchaseDate, uLife);

      return {
        id: a.id,
        code: a.code,
        qrCode: a.qrCode,
        name: a.name,
        quantity: a.quantity ?? 1,
        unit: a.unit || 'PZA',
        category: a.category,
        status: a.status,
        location: a.location,
        brand: a.brand,
        model: a.model,
        serialNumber: a.serialNumber,
        purchaseDate: a.purchaseDate,
        purchaseValue: pVal,
        currentValue: a.currentValue ? Number(a.currentValue) : null,
        dep: fin.dep,
        depac: fin.depac,
        balance: fin.balance,
        createdAt: a.createdAt,
      };
    });

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

    if (!asset) return null;

    const pVal = asset.purchaseValue ? Number(asset.purchaseValue) : 0;
    const uLife = asset.category?.usefulLife ?? 5;
    const fin = calculateFinancials(pVal, asset.purchaseDate, uLife);

    return {
      ...asset,
      purchaseValue: pVal as any,
      currentValue: asset.currentValue ? (Number(asset.currentValue) as any) : null,
      residualValue: asset.residualValue ? (Number(asset.residualValue) as any) : null,
      dep: fin.dep,
      depac: fin.depac,
      balance: fin.balance,
    } as AssetDetail;
  }

  async findRawById(id: string): Promise<Asset | null> {
    const item = await prisma.asset.findFirst({
      where: { id, deletedAt: null },
    });
    return item as unknown as Asset | null;
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

    if (!asset) return null;

    const pVal = asset.purchaseValue ? Number(asset.purchaseValue) : 0;
    const uLife = asset.category?.usefulLife ?? 5;
    const fin = calculateFinancials(pVal, asset.purchaseDate, uLife);

    return {
      ...asset,
      purchaseValue: pVal as any,
      currentValue: asset.currentValue ? (Number(asset.currentValue) as any) : null,
      residualValue: asset.residualValue ? (Number(asset.residualValue) as any) : null,
      dep: fin.dep,
      depac: fin.depac,
      balance: fin.balance,
    } as AssetDetail;
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

    if (!asset) return null;

    const pVal = asset.purchaseValue ? Number(asset.purchaseValue) : 0;
    const uLife = asset.category?.usefulLife ?? 5;
    const fin = calculateFinancials(pVal, asset.purchaseDate, uLife);

    return {
      ...asset,
      purchaseValue: pVal as any,
      currentValue: asset.currentValue ? (Number(asset.currentValue) as any) : null,
      residualValue: asset.residualValue ? (Number(asset.residualValue) as any) : null,
      dep: fin.dep,
      depac: fin.depac,
      balance: fin.balance,
    } as AssetDetail;
  }

  async findBySerial(serialNumber: string): Promise<Asset | null> {
    const item = await prisma.asset.findFirst({
      where: { serialNumber, deletedAt: null },
    });
    return item as unknown as Asset | null;
  }

  async create(data: CreateAssetDto): Promise<Asset> {
    const qrCode = data.qrCode || data.code;

    const item = await prisma.asset.create({
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
    return item as unknown as Asset;
  }

  async update(id: string, data: UpdateAssetDto): Promise<Asset> {
    const item = await prisma.asset.update({
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
    return item as unknown as Asset;
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

import { AssetMaintenance } from '../../domain/maintenances/maintenance.entity';
import { MaintenanceType } from '../../domain/enums/maintenance-type.enum';
import { prisma } from '../database/prisma.service';
import {
  IMaintenanceRepository,
  AssetMaintenanceDetail,
  FindAllMaintenancesOptions,
  PaginatedMaintenances,
  CreateMaintenanceDto,
  UpdateMaintenanceDto,
} from '../../domain/maintenances/maintenance.repository.interface';

export class MaintenanceRepository implements IMaintenanceRepository {
  async findAll(options: FindAllMaintenancesOptions): Promise<PaginatedMaintenances> {
    const page = options.page && options.page > 0 ? options.page : 1;
    const limit = options.limit && options.limit > 0 ? options.limit : 20;
    const skip = (page - 1) * limit;

    const whereCondition: any = {};

    if (options.assetId) {
      whereCondition.assetId = options.assetId;
    }

    if (options.type) {
      whereCondition.type = options.type;
    }

    if (options.search) {
      whereCondition.OR = [
        { provider: { contains: options.search } },
        { observations: { contains: options.search } },
        { asset: { code: { contains: options.search } } },
        { asset: { name: { contains: options.search } } },
      ];
    }

    const [total, items] = await Promise.all([
      prisma.assetMaintenance.count({ where: whereCondition }),
      prisma.assetMaintenance.findMany({
        where: whereCondition,
        orderBy: { maintenanceDate: 'desc' },
        skip,
        take: limit,
        include: {
          asset: {
            select: {
              id: true,
              code: true,
              name: true,
              category: { select: { id: true, name: true } },
              status: { select: { id: true, name: true } },
              location: { select: { id: true, name: true } },
            },
          },
        },
      }),
    ]);

    return {
      data: items as unknown as AssetMaintenanceDetail[],
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async findById(id: string): Promise<AssetMaintenanceDetail | null> {
    const item = await prisma.assetMaintenance.findUnique({
      where: { id },
      include: {
        asset: {
          select: {
            id: true,
            code: true,
            name: true,
            category: { select: { id: true, name: true } },
            status: { select: { id: true, name: true } },
            location: { select: { id: true, name: true } },
          },
        },
      },
    });

    return item as unknown as AssetMaintenanceDetail | null;
  }

  async findByAssetId(assetId: string, type?: MaintenanceType): Promise<AssetMaintenanceDetail[]> {
    const whereCondition: any = { assetId };
    if (type) {
      whereCondition.type = type;
    }

    const items = await prisma.assetMaintenance.findMany({
      where: whereCondition,
      orderBy: { maintenanceDate: 'desc' },
    });

    return items as unknown as AssetMaintenanceDetail[];
  }

  async create(data: CreateMaintenanceDto): Promise<AssetMaintenance> {
    const item = await prisma.assetMaintenance.create({
      data: {
        assetId: data.assetId,
        type: (data.type as any) || 'PREVENTIVE',
        maintenanceDate: data.maintenanceDate,
        provider: data.provider || null,
        cost: data.cost !== undefined ? data.cost : null,
        nextMaintenance: data.nextMaintenance || null,
        observations: data.observations || null,
      },
    });
    return item as unknown as AssetMaintenance;
  }

  async update(id: string, data: UpdateMaintenanceDto): Promise<AssetMaintenance> {
    const item = await prisma.assetMaintenance.update({
      where: { id },
      data: {
        ...(data.type !== undefined && { type: data.type as any }),
        ...(data.maintenanceDate !== undefined && { maintenanceDate: data.maintenanceDate }),
        ...(data.provider !== undefined && { provider: data.provider }),
        ...(data.cost !== undefined && { cost: data.cost }),
        ...(data.nextMaintenance !== undefined && { nextMaintenance: data.nextMaintenance }),
        ...(data.observations !== undefined && { observations: data.observations }),
      },
    });
    return item as unknown as AssetMaintenance;
  }

  async delete(id: string): Promise<void> {
    await prisma.assetMaintenance.delete({
      where: { id },
    });
  }

  async existsAsset(assetId: string): Promise<boolean> {
    const count = await prisma.asset.count({ where: { id: assetId, deletedAt: null } });
    return count > 0;
  }
}

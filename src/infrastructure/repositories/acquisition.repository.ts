import { AcquisitionEntity } from '../../domain/acquisitions/acquisition.entity';
import {
  IAcquisitionRepository,
  CreateAcquisitionDTO,
  UpdateAcquisitionDTO,
  QueryAcquisitionOptions,
  CreateAcquisitionDetailDTO,
} from '../../domain/acquisitions/acquisition.repository.interface';
import { prisma } from '../database/prisma.service';

export class AcquisitionRepository implements IAcquisitionRepository {
  private client: any;

  constructor(client: any = prisma) {
    this.client = client || prisma;
  }

  private mapToEntity(item: any): AcquisitionEntity {
    return new AcquisitionEntity({
      id: item.id,
      userId: item.userId,
      projectId: item.projectId,
      checkoutUserId: item.checkoutUserId,
      departureDate: item.departureDate,
      type: item.type || 'SUPPLY',
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      user: item.user
        ? {
            id: item.user.id,
            fullName: item.user.fullName,
            email: item.user.email,
            profession: item.user.profession,
          }
        : null,
      project: item.project
        ? {
            id: item.project.id,
            name: item.project.name,
          }
        : null,
      checkoutUser: item.checkoutUser
        ? {
            id: item.checkoutUser.id,
            fullName: item.checkoutUser.fullName,
            email: item.checkoutUser.email,
            profession: item.checkoutUser.profession,
          }
        : null,
      details: item.details
        ? item.details.map((d: any) => ({
            id: d.id,
            acquisitionId: d.acquisitionId,
            supplyId: d.supplyId,
            assetId: d.assetId,
            unit: d.unit,
            quantity: d.quantity,
            createdAt: d.createdAt,
            updatedAt: d.updatedAt,
            supply: d.supply ? { id: d.supply.id, name: d.supply.name, unit: d.supply.unit } : null,
            asset: d.asset ? { id: d.asset.id, code: d.asset.code, name: d.asset.name } : null,
          }))
        : [],
    });
  }

  public async findAll(options: QueryAcquisitionOptions = {}): Promise<{ data: AcquisitionEntity[]; total: number }> {
    const page = Math.max(1, options.page || 1);
    const limit = Math.max(1, Math.min(200, options.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (options.userId) where.userId = options.userId;
    if (options.projectId) where.projectId = options.projectId;
    if (options.checkoutUserId) where.checkoutUserId = options.checkoutUserId;
    if (options.type) where.type = options.type;

    if (options.search && options.search.trim()) {
      const q = options.search.trim();
      where.OR = [
        { user: { fullName: { contains: q } } },
        { project: { name: { contains: q } } },
        { checkoutUser: { fullName: { contains: q } } },
        { details: { some: { supply: { name: { contains: q } } } } },
        { details: { some: { asset: { name: { contains: q } } } } },
      ];
    }

    const [rawItems, total] = await Promise.all([
      this.client.acquisition.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: options.sortOrder === 'asc' ? 'asc' : 'desc' },
        include: {
          user: true,
          project: true,
          checkoutUser: true,
          details: {
            include: {
              supply: true,
              asset: true,
            },
          },
        },
      }),
      this.client.acquisition.count({ where }),
    ]);

    return {
      data: rawItems.map((item: any) => this.mapToEntity(item)),
      total,
    };
  }

  public async findById(id: string): Promise<AcquisitionEntity | null> {
    const raw = await this.client.acquisition.findUnique({
      where: { id },
      include: {
        user: true,
        project: true,
        checkoutUser: true,
        details: {
          include: {
            supply: true,
            asset: true,
          },
        },
      },
    });

    if (!raw) return null;
    return this.mapToEntity(raw);
  }

  public async create(dto: CreateAcquisitionDTO): Promise<AcquisitionEntity> {
    const created = await this.client.acquisition.create({
      data: {
        userId: dto.userId,
        projectId: dto.projectId || null,
        checkoutUserId: dto.checkoutUserId || null,
        departureDate: dto.departureDate ? new Date(dto.departureDate) : null,
        type: dto.type || 'SUPPLY',
        details: dto.details && dto.details.length > 0
          ? {
              create: dto.details.map((d) => ({
                supplyId: d.supplyId || null,
                assetId: d.assetId || null,
                unit: d.unit || 'PZA',
                quantity: d.quantity || 1,
              })),
            }
          : undefined,
      },
      include: {
        user: true,
        project: true,
        checkoutUser: true,
        details: {
          include: {
            supply: true,
            asset: true,
          },
        },
      },
    });

    return this.mapToEntity(created);
  }

  public async update(id: string, dto: UpdateAcquisitionDTO): Promise<AcquisitionEntity> {
    if (dto.details !== undefined) {
      await this.client.acquisitionDetail.deleteMany({
        where: { acquisitionId: id },
      });
    }

    const updated = await this.client.acquisition.update({
      where: { id },
      data: {
        userId: dto.userId !== undefined ? dto.userId : undefined,
        projectId: dto.projectId !== undefined ? dto.projectId : undefined,
        checkoutUserId: dto.checkoutUserId !== undefined ? dto.checkoutUserId : undefined,
        departureDate: dto.departureDate !== undefined ? (dto.departureDate ? new Date(dto.departureDate) : null) : undefined,
        type: dto.type !== undefined ? dto.type : undefined,
        details: dto.details && dto.details.length > 0
          ? {
              create: dto.details.map((d) => ({
                supplyId: d.supplyId || null,
                assetId: d.assetId || null,
                unit: d.unit || 'PZA',
                quantity: d.quantity || 1,
              })),
            }
          : undefined,
      },
      include: {
        user: true,
        project: true,
        checkoutUser: true,
        details: {
          include: {
            supply: true,
            asset: true,
          },
        },
      },
    });

    return this.mapToEntity(updated);
  }

  public async delete(id: string): Promise<boolean> {
    await this.client.acquisition.delete({
      where: { id },
    });
    return true;
  }

  public async addDetail(dto: CreateAcquisitionDetailDTO): Promise<any> {
    const detail = await this.client.acquisitionDetail.create({
      data: {
        acquisitionId: dto.acquisitionId,
        supplyId: dto.supplyId || null,
        assetId: dto.assetId || null,
        unit: dto.unit || 'PZA',
        quantity: dto.quantity || 1,
      },
      include: {
        supply: true,
        asset: true,
      },
    });
    return detail;
  }

  public async deleteDetail(detailId: string): Promise<boolean> {
    await this.client.acquisitionDetail.delete({
      where: { id: detailId },
    });
    return true;
  }
}

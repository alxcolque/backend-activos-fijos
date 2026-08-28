import { PrismaClient } from '@prisma/client';
import { AcquisitionEntity } from '../../domain/acquisitions/acquisition.entity';
import {
  IAcquisitionRepository,
  CreateAcquisitionDTO,
  UpdateAcquisitionDTO,
  QueryAcquisitionOptions,
} from '../../domain/acquisitions/acquisition.repository.interface';
import { prisma } from '../database/prisma.service';

export class AcquisitionRepository implements IAcquisitionRepository {
  private client: any;

  constructor(client: any = prisma) {
    this.client = client;
  }

  private mapToEntity(item: any): AcquisitionEntity {
    return new AcquisitionEntity({
      id: item.id,
      userId: item.userId,
      projectUserId: item.projectUserId,
      checkoutUserId: item.checkoutUserId,
      departureDate: item.departureDate,
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
      projectUser: item.projectUser
        ? {
            id: item.projectUser.id,
            fullName: item.projectUser.fullName,
            email: item.projectUser.email,
            profession: item.projectUser.profession,
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
            projectId: d.projectId,
            unit: d.unit,
            quantity: d.quantity,
            createdAt: d.createdAt,
            updatedAt: d.updatedAt,
            project: d.project ? { id: d.project.id, name: d.project.name } : null,
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
    if (options.projectUserId) where.projectUserId = options.projectUserId;
    if (options.checkoutUserId) where.checkoutUserId = options.checkoutUserId;

    if (options.search && options.search.trim()) {
      const q = options.search.trim();
      where.OR = [
        { user: { fullName: { contains: q } } },
        { projectUser: { fullName: { contains: q } } },
        { checkoutUser: { fullName: { contains: q } } },
        { details: { some: { project: { name: { contains: q } } } } },
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
          projectUser: true,
          checkoutUser: true,
          details: {
            include: {
              project: true,
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
        projectUser: true,
        checkoutUser: true,
        details: {
          include: {
            project: true,
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
        projectUserId: dto.projectUserId || null,
        checkoutUserId: dto.checkoutUserId || null,
        departureDate: dto.departureDate ? new Date(dto.departureDate) : null,
        details: dto.details && dto.details.length > 0
          ? {
              create: dto.details.map((d) => ({
                projectId: d.projectId || null,
                unit: d.unit || 'PZA',
                quantity: d.quantity || 1,
              })),
            }
          : undefined,
      },
      include: {
        user: true,
        projectUser: true,
        checkoutUser: true,
        details: {
          include: {
            project: true,
          },
        },
      },
    });

    return this.mapToEntity(created);
  }

  public async update(id: string, dto: UpdateAcquisitionDTO): Promise<AcquisitionEntity> {
    // Si se pasan nuevos detalles, eliminar los existentes y reemplazarlos
    if (dto.details !== undefined) {
      await this.client.acquisitionDetail.deleteMany({
        where: { acquisitionId: id },
      });
    }

    const updated = await this.client.acquisition.update({
      where: { id },
      data: {
        userId: dto.userId !== undefined ? dto.userId : undefined,
        projectUserId: dto.projectUserId !== undefined ? dto.projectUserId : undefined,
        checkoutUserId: dto.checkoutUserId !== undefined ? dto.checkoutUserId : undefined,
        departureDate: dto.departureDate !== undefined ? (dto.departureDate ? new Date(dto.departureDate) : null) : undefined,
        details: dto.details && dto.details.length > 0
          ? {
              create: dto.details.map((d) => ({
                projectId: d.projectId || null,
                unit: d.unit || 'PZA',
                quantity: d.quantity || 1,
              })),
            }
          : undefined,
      },
      include: {
        user: true,
        projectUser: true,
        checkoutUser: true,
        details: {
          include: {
            project: true,
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
}

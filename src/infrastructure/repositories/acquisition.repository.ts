import { AcquisitionEntity } from '../../domain/acquisitions/acquisition.entity';
import {
  IAcquisitionRepository,
  CreateAcquisitionDTO,
  UpdateAcquisitionDTO,
  QueryAcquisitionOptions,
  CreateAcquisitionDetailDTO,
} from '../../domain/acquisitions/acquisition.repository.interface';
import { prisma } from '../database/prisma.service';
import { AppError, NotFoundError } from '../../shared/errors/app-error';

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
    if (dto.details && dto.details.length > 0) {
      for (const d of dto.details) {
        const qty = d.quantity || 1;

        if (d.assetId) {
          const asset = await this.client.asset.findUnique({
            where: { id: d.assetId },
          });
          if (!asset) {
            throw new NotFoundError('El activo fijo especificado no existe.');
          }
          const availableStock = asset.quantity - (asset.quantityOut || 0);
          if (availableStock < qty) {
            throw new AppError(
              `El activo fijo "${asset.name}" [${asset.code}] no tiene stock disponible (Disponibles: ${availableStock}, Requeridos: ${qty}).`
            );
          }
        }

        if (d.supplyId && dto.projectId) {
          const supplyProject = await this.client.supplyProject.findFirst({
            where: { supplyId: d.supplyId, projectId: dto.projectId },
            include: { supply: true },
          });

          if (!supplyProject) {
            throw new NotFoundError('El suministro seleccionado no está asignado al proyecto especificado.');
          }

          const availableStock = supplyProject.quantity - (supplyProject.outputQuantity || 0);
          if (availableStock < qty) {
            throw new AppError(
              `El suministro "${supplyProject.supply?.name || 'solicitado'}" no tiene stock disponible en este proyecto (Disponibles: ${availableStock}, Requeridos: ${qty}).`
            );
          }
        }
      }
    }

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

    if (dto.details && dto.details.length > 0) {
      for (const d of dto.details) {
        const qty = d.quantity || 1;
        if (d.assetId) {
          await this.client.asset.update({
            where: { id: d.assetId },
            data: { quantityOut: { increment: qty } },
          });
        }
        if (d.supplyId && dto.projectId) {
          const sp = await this.client.supplyProject.findFirst({
            where: { supplyId: d.supplyId, projectId: dto.projectId },
          });
          if (sp) {
            await this.client.supplyProject.update({
              where: { id: sp.id },
              data: { outputQuantity: { increment: qty } },
            });
          }
          await this.client.supply.update({
            where: { id: d.supplyId },
            data: { outputQuantity: { increment: qty } },
          });
        }
      }
    }

    return this.mapToEntity(created);
  }

  public async update(id: string, dto: UpdateAcquisitionDTO): Promise<AcquisitionEntity> {
    const existing = await this.client.acquisition.findUnique({
      where: { id },
      include: { details: true },
    });

    if (dto.details !== undefined && existing) {
      // Revertir stocks anteriores
      for (const d of existing.details) {
        if (d.assetId) {
          await this.client.asset.update({
            where: { id: d.assetId },
            data: { quantityOut: { decrement: d.quantity } },
          });
        }
        if (d.supplyId && existing.projectId) {
          const sp = await this.client.supplyProject.findFirst({
            where: { supplyId: d.supplyId, projectId: existing.projectId },
          });
          if (sp) {
            await this.client.supplyProject.update({
              where: { id: sp.id },
              data: { outputQuantity: { decrement: d.quantity } },
            });
          }
          await this.client.supply.update({
            where: { id: d.supplyId },
            data: { outputQuantity: { decrement: d.quantity } },
          });
        }
      }

      await this.client.acquisitionDetail.deleteMany({
        where: { acquisitionId: id },
      });
    }

    const targetProjectId = dto.projectId !== undefined ? dto.projectId : existing?.projectId;

    if (dto.details && dto.details.length > 0) {
      for (const d of dto.details) {
        const qty = d.quantity || 1;

        if (d.assetId) {
          const asset = await this.client.asset.findUnique({ where: { id: d.assetId } });
          if (!asset) throw new NotFoundError('El activo fijo especificado no existe.');
          const availableStock = asset.quantity - (asset.quantityOut || 0);
          if (availableStock < qty) {
            throw new AppError(
              `El activo fijo "${asset.name}" [${asset.code}] no tiene stock disponible (Disponibles: ${availableStock}, Requeridos: ${qty}).`
            );
          }
        }

        if (d.supplyId && targetProjectId) {
          const sp = await this.client.supplyProject.findFirst({
            where: { supplyId: d.supplyId, projectId: targetProjectId },
            include: { supply: true },
          });
          if (!sp) throw new NotFoundError('El suministro no está asignado al proyecto especificado.');
          const availableStock = sp.quantity - (sp.outputQuantity || 0);
          if (availableStock < qty) {
            throw new AppError(
              `El suministro "${sp.supply?.name || 'solicitado'}" no tiene stock disponible en este proyecto (Disponibles: ${availableStock}, Requeridos: ${qty}).`
            );
          }
        }
      }
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

    if (dto.details && dto.details.length > 0) {
      for (const d of dto.details) {
        const qty = d.quantity || 1;
        if (d.assetId) {
          await this.client.asset.update({
            where: { id: d.assetId },
            data: { quantityOut: { increment: qty } },
          });
        }
        if (d.supplyId && targetProjectId) {
          const sp = await this.client.supplyProject.findFirst({
            where: { supplyId: d.supplyId, projectId: targetProjectId },
          });
          if (sp) {
            await this.client.supplyProject.update({
              where: { id: sp.id },
              data: { outputQuantity: { increment: qty } },
            });
          }
          await this.client.supply.update({
            where: { id: d.supplyId },
            data: { outputQuantity: { increment: qty } },
          });
        }
      }
    }

    return this.mapToEntity(updated);
  }

  public async delete(id: string): Promise<boolean> {
    const acquisition = await this.client.acquisition.findUnique({
      where: { id },
      include: { details: true },
    });

    if (!acquisition) return false;

    if (acquisition.details && acquisition.details.length > 0) {
      for (const d of acquisition.details) {
        if (d.assetId) {
          await this.client.asset.update({
            where: { id: d.assetId },
            data: { quantityOut: { decrement: d.quantity } },
          });
        }
        if (d.supplyId && acquisition.projectId) {
          const sp = await this.client.supplyProject.findFirst({
            where: { supplyId: d.supplyId, projectId: acquisition.projectId },
          });
          if (sp) {
            await this.client.supplyProject.update({
              where: { id: sp.id },
              data: { outputQuantity: { decrement: d.quantity } },
            });
          }
          await this.client.supply.update({
            where: { id: d.supplyId },
            data: { outputQuantity: { decrement: d.quantity } },
          });
        }
      }
    }

    await this.client.acquisition.delete({
      where: { id },
    });
    return true;
  }

  public async addDetail(dto: CreateAcquisitionDetailDTO): Promise<any> {
    const qty = dto.quantity || 1;

    const acquisition = await this.client.acquisition.findUnique({
      where: { id: dto.acquisitionId },
    });

    if (!acquisition) {
      throw new NotFoundError('El registro de personal no existe.');
    }

    if (dto.assetId) {
      const asset = await this.client.asset.findUnique({
        where: { id: dto.assetId },
      });

      if (!asset) {
        throw new NotFoundError('El activo fijo especificado no existe.');
      }

      const availableStock = asset.quantity - (asset.quantityOut || 0);
      if (availableStock < qty) {
        throw new AppError(
          `El activo fijo "${asset.name}" [${asset.code}] no tiene stock disponible (Total: ${asset.quantity}, Salida: ${asset.quantityOut || 0}, Disponibles: ${availableStock}).`
        );
      }

      const detail = await this.client.acquisitionDetail.create({
        data: {
          acquisitionId: dto.acquisitionId,
          supplyId: null,
          assetId: dto.assetId,
          unit: dto.unit || 'PZA',
          quantity: qty,
        },
        include: {
          supply: true,
          asset: true,
        },
      });

      await this.client.asset.update({
        where: { id: dto.assetId },
        data: { quantityOut: { increment: qty } },
      });

      return detail;
    }

    if (dto.supplyId) {
      if (!acquisition.projectId) {
        throw new AppError('El registro de personal no tiene un proyecto asignado para entregar suministros.');
      }

      const supplyProject = await this.client.supplyProject.findFirst({
        where: { supplyId: dto.supplyId, projectId: acquisition.projectId },
        include: { supply: true },
      });

      if (!supplyProject) {
        throw new NotFoundError('El suministro seleccionado no está asignado al proyecto de esta entrega.');
      }

      const availableStock = supplyProject.quantity - (supplyProject.outputQuantity || 0);
      if (availableStock < qty) {
        throw new AppError(
          `El suministro "${supplyProject.supply?.name || 'solicitado'}" no tiene stock disponible en este proyecto (Asignados: ${supplyProject.quantity}, Entregados: ${supplyProject.outputQuantity || 0}, Disponibles: ${availableStock}).`
        );
      }

      const detail = await this.client.acquisitionDetail.create({
        data: {
          acquisitionId: dto.acquisitionId,
          supplyId: dto.supplyId,
          assetId: null,
          unit: dto.unit || supplyProject.supply?.unit || 'PZA',
          quantity: qty,
        },
        include: {
          supply: true,
          asset: true,
        },
      });

      await this.client.supplyProject.update({
        where: { id: supplyProject.id },
        data: { outputQuantity: { increment: qty } },
      });

      await this.client.supply.update({
        where: { id: dto.supplyId },
        data: { outputQuantity: { increment: qty } },
      });

      return detail;
    }

    const detail = await this.client.acquisitionDetail.create({
      data: {
        acquisitionId: dto.acquisitionId,
        supplyId: null,
        assetId: null,
        unit: dto.unit || 'PZA',
        quantity: qty,
      },
      include: {
        supply: true,
        asset: true,
      },
    });

    return detail;
  }

  public async deleteDetail(detailId: string): Promise<boolean> {
    const detail = await this.client.acquisitionDetail.findUnique({
      where: { id: detailId },
      include: { acquisition: true },
    });

    if (!detail) return false;

    if (detail.assetId) {
      await this.client.asset.update({
        where: { id: detail.assetId },
        data: { quantityOut: { decrement: detail.quantity } },
      });
    }

    if (detail.supplyId && detail.acquisition?.projectId) {
      const sp = await this.client.supplyProject.findFirst({
        where: { supplyId: detail.supplyId, projectId: detail.acquisition.projectId },
      });
      if (sp) {
        await this.client.supplyProject.update({
          where: { id: sp.id },
          data: { outputQuantity: { decrement: detail.quantity } },
        });
      }
      await this.client.supply.update({
        where: { id: detail.supplyId },
        data: { outputQuantity: { decrement: detail.quantity } },
      });
    }

    await this.client.acquisitionDetail.delete({
      where: { id: detailId },
    });

    return true;
  }
}

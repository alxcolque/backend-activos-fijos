import { AssetProject } from '../../domain/asset-projects/asset-project.entity';
import { prisma } from '../database/prisma.service';
import {
  IAssetProjectRepository,
  AssetProjectDetail,
  FindAllAssetProjectsOptions,
  PaginatedAssetProjects,
} from '../../domain/asset-projects/asset-project.repository.interface';

export class AssetProjectRepository implements IAssetProjectRepository {
  async findAll(options: FindAllAssetProjectsOptions): Promise<PaginatedAssetProjects> {
    const page = options.page && options.page > 0 ? options.page : 1;
    const limit = options.limit && options.limit > 0 ? options.limit : 20;
    const skip = (page - 1) * limit;

    const whereCondition: any = {};

    if (options.projectId) {
      whereCondition.projectId = options.projectId;
    }

    if (options.assetId) {
      whereCondition.assetId = options.assetId;
    }

    if (options.activeOnly) {
      whereCondition.releasedAt = null;
    }

    const [total, items] = await Promise.all([
      prisma.assetProject.count({ where: whereCondition }),
      prisma.assetProject.findMany({
        where: whereCondition,
        orderBy: { assignedAt: 'desc' },
        skip,
        take: limit,
        include: {
          asset: {
            select: {
              id: true,
              code: true,
              name: true,
              brand: true,
              model: true,
              serialNumber: true,
              unit: true,
              quantity: true,
              quantityOut: true,
              category: { select: { id: true, name: true } },
              status: { select: { id: true, name: true } },
            },
          },
          project: {
            select: {
              id: true,
              name: true,
              address: true,
              responsible: true,
              status: true,
            },
          },
        },
      }),
    ]);

    return {
      data: items as unknown as AssetProjectDetail[],
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async findActiveAssignmentByAssetId(assetId: string): Promise<AssetProject | null> {
    return prisma.assetProject.findFirst({
      where: {
        assetId,
        releasedAt: null,
      },
    });
  }

  async findActiveAssignment(assetId: string, projectId: string): Promise<AssetProject | null> {
    return prisma.assetProject.findFirst({
      where: {
        assetId,
        projectId,
        releasedAt: null,
      },
    });
  }

  async findByProjectId(projectId: string, activeOnly = false): Promise<AssetProjectDetail[]> {
    const whereCondition: any = { projectId };
    if (activeOnly) {
      whereCondition.releasedAt = null;
    }

    const items = await prisma.assetProject.findMany({
      where: whereCondition,
      orderBy: { assignedAt: 'desc' },
      include: {
        asset: {
          select: {
            id: true,
            code: true,
            name: true,
            brand: true,
            model: true,
            serialNumber: true,
            unit: true,
            quantity: true,
            quantityOut: true,
            category: { select: { id: true, name: true } },
            status: { select: { id: true, name: true } },
          },
        },
      },
    });

    return items as unknown as AssetProjectDetail[];
  }

  async findByAssetId(assetId: string): Promise<AssetProjectDetail[]> {
    const items = await prisma.assetProject.findMany({
      where: { assetId },
      orderBy: { assignedAt: 'desc' },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            address: true,
            responsible: true,
            status: true,
          },
        },
      },
    });

    return items as unknown as AssetProjectDetail[];
  }

  async assign(data: { assetId: string; projectId: string; quantity?: number; observations?: string }): Promise<AssetProject> {
    const qty = data.quantity && data.quantity > 0 ? data.quantity : 1;
    const [assignment] = await prisma.$transaction([
      prisma.assetProject.create({
        data: {
          assetId: data.assetId,
          projectId: data.projectId,
          quantity: qty,
          assignedAt: new Date(),
          releasedAt: null,
          observations: data.observations || null,
        },
      }),
      prisma.asset.update({
        where: { id: data.assetId },
        data: {
          quantityOut: { increment: qty },
        },
      }),
    ]);
    return assignment;
  }

  async release(id: string, observations?: string, quantityToRelease?: number): Promise<AssetProject> {
    const current = await prisma.assetProject.findUnique({ where: { id } });
    if (!current) throw new Error(`AssetProject with id ${id} not found`);
    const totalQty = current.quantity ?? 1;
    const qtyToRelease = quantityToRelease && quantityToRelease > 0 && quantityToRelease <= totalQty ? quantityToRelease : totalQty;

    if (qtyToRelease < totalQty) {
      const remaining = totalQty - qtyToRelease;
      await prisma.assetProject.update({
        where: { id },
        data: { quantity: remaining },
      });

      const [released] = await prisma.$transaction([
        prisma.assetProject.create({
          data: {
            assetId: current.assetId,
            projectId: current.projectId,
            quantity: qtyToRelease,
            assignedAt: current.assignedAt,
            releasedAt: new Date(),
            observations: observations || current.observations || null,
          },
        }),
        prisma.asset.update({
          where: { id: current.assetId },
          data: { quantityOut: { decrement: qtyToRelease } },
        }),
      ]);
      return released;
    } else {
      const [released] = await prisma.$transaction([
        prisma.assetProject.update({
          where: { id },
          data: {
            releasedAt: new Date(),
            ...(observations && { observations }),
          },
        }),
        prisma.asset.update({
          where: { id: current.assetId },
          data: {
            quantityOut: { decrement: totalQty },
          },
        }),
      ]);
      return released;
    }
  }

  async findById(id: string): Promise<AssetProject | null> {
    return prisma.assetProject.findUnique({ where: { id } });
  }

  async deleteAssignment(id: string): Promise<boolean> {
    const current = await prisma.assetProject.findUnique({ where: { id } });
    if (!current) return false;

    if (!current.releasedAt) {
      const qty = current.quantity ?? 1;
      await prisma.$transaction([
        prisma.assetProject.delete({ where: { id } }),
        prisma.asset.update({
          where: { id: current.assetId },
          data: { quantityOut: { decrement: qty } },
        }),
      ]);
    } else {
      await prisma.assetProject.delete({ where: { id } });
    }

    return true;
  }

  async existsAsset(assetId: string): Promise<boolean> {
    const count = await prisma.asset.count({ where: { id: assetId, deletedAt: null } });
    return count > 0;
  }

  async getAssetStock(assetId: string): Promise<{ exists: boolean; name?: string; code?: string; quantity?: number; quantityOut?: number; available?: number }> {
    const asset = await prisma.asset.findFirst({
      where: { id: assetId, deletedAt: null },
      select: { id: true, name: true, code: true, quantity: true, quantityOut: true },
    });
    if (!asset) return { exists: false };
    const qty = asset.quantity || 1;
    const out = asset.quantityOut || 0;
    return {
      exists: true,
      name: asset.name,
      code: asset.code,
      quantity: qty,
      quantityOut: out,
      available: Math.max(0, qty - out),
    };
  }

  async findProjectStatus(projectId: string): Promise<{ exists: boolean; status?: string; name?: string }> {
    const project = await prisma.project.findFirst({
      where: { id: projectId, deletedAt: null },
      select: { id: true, status: true, name: true },
    });

    if (!project) {
      return { exists: false };
    }

    return {
      exists: true,
      status: project.status,
      name: project.name,
    };
  }
}

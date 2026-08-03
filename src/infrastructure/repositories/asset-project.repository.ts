import { AssetProject } from '@prisma/client';
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
              category: { select: { id: true, name: true } },
              status: { select: { id: true, name: true } },
            },
          },
          project: {
            select: {
              id: true,
              code: true,
              name: true,
              type: true,
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
            code: true,
            name: true,
            type: true,
            status: true,
          },
        },
      },
    });

    return items as unknown as AssetProjectDetail[];
  }

  async assign(data: { assetId: string; projectId: string; observations?: string }): Promise<AssetProject> {
    return prisma.assetProject.create({
      data: {
        assetId: data.assetId,
        projectId: data.projectId,
        assignedAt: new Date(),
        releasedAt: null,
        observations: data.observations || null,
      },
    });
  }

  async release(id: string, observations?: string): Promise<AssetProject> {
    return prisma.assetProject.update({
      where: { id },
      data: {
        releasedAt: new Date(),
        ...(observations && { observations }),
      },
    });
  }

  async existsAsset(assetId: string): Promise<boolean> {
    const count = await prisma.asset.count({ where: { id: assetId, deletedAt: null } });
    return count > 0;
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

import { Project } from '@prisma/client';
import { prisma } from '../database/prisma.service';
import {
  IProjectRepository,
  ProjectWithCount,
  FindAllProjectsOptions,
  PaginatedProjects,
} from '../../domain/projects/project.repository.interface';

export class ProjectRepository implements IProjectRepository {
  async findAll(options: FindAllProjectsOptions): Promise<PaginatedProjects> {
    const page = options.page && options.page > 0 ? options.page : 1;
    const limit = options.limit && options.limit > 0 ? options.limit : 20;
    const skip = (page - 1) * limit;

    const whereCondition: any = {
      deletedAt: null,
    };

    if (options.type) {
      whereCondition.type = options.type;
    }

    if (options.status) {
      whereCondition.status = options.status;
    }

    if (options.search) {
      whereCondition.OR = [
        { code: { contains: options.search } },
        { name: { contains: options.search } },
        { description: { contains: options.search } },
      ];
    }

    const sortBy = options.sortBy || 'name';
    const sortOrder = options.sortOrder || 'asc';

    const [total, projects] = await Promise.all([
      prisma.project.count({ where: whereCondition }),
      prisma.project.findMany({
        where: whereCondition,
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
        select: {
          id: true,
          code: true,
          name: true,
          type: true,
          status: true,
          startDate: true,
          endDate: true,
          description: true,
          createdAt: true,
          updatedAt: true,
          deletedAt: true,
          _count: {
            select: {
              assetProjects: true,
            },
          },
        },
      }),
    ]);

    const formattedData: ProjectWithCount[] = projects.map((p) => ({
      id: p.id,
      code: p.code,
      name: p.name,
      type: p.type,
      status: p.status,
      startDate: p.startDate,
      endDate: p.endDate,
      description: p.description,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      deletedAt: p.deletedAt,
      totalAssets: p._count.assetProjects,
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

  async findById(id: string): Promise<ProjectWithCount | null> {
    const p = await prisma.project.findFirst({
      where: { id, deletedAt: null },
      select: {
        id: true,
        code: true,
        name: true,
        type: true,
        status: true,
        startDate: true,
        endDate: true,
        description: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
        _count: {
          select: {
            assetProjects: true,
          },
        },
      },
    });

    if (!p) return null;

    return {
      id: p.id,
      code: p.code,
      name: p.name,
      type: p.type,
      status: p.status,
      startDate: p.startDate,
      endDate: p.endDate,
      description: p.description,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      deletedAt: p.deletedAt,
      totalAssets: p._count.assetProjects,
    };
  }

  async findRawById(id: string): Promise<Project | null> {
    return prisma.project.findFirst({
      where: { id, deletedAt: null },
    });
  }

  async findByCode(code: string): Promise<Project | null> {
    return prisma.project.findFirst({
      where: { code, deletedAt: null },
    });
  }

  async findByName(name: string): Promise<Project | null> {
    return prisma.project.findFirst({
      where: { name, deletedAt: null },
    });
  }

  async create(data: {
    code: string;
    name: string;
    type?: any;
    status?: any;
    startDate?: Date | null;
    endDate?: Date | null;
    description?: string | null;
  }): Promise<Project> {
    return prisma.project.create({
      data: {
        code: data.code,
        name: data.name,
        type: data.type || 'ADMINISTRATIVE',
        status: data.status || 'ACTIVE',
        startDate: data.startDate || null,
        endDate: data.endDate || null,
        description: data.description || null,
      },
    });
  }

  async update(
    id: string,
    data: {
      code?: string;
      name?: string;
      type?: any;
      status?: any;
      startDate?: Date | null;
      endDate?: Date | null;
      description?: string | null;
    },
  ): Promise<Project> {
    return prisma.project.update({
      where: { id },
      data: {
        ...(data.code !== undefined && { code: data.code }),
        ...(data.name !== undefined && { name: data.name }),
        ...(data.type !== undefined && { type: data.type }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.startDate !== undefined && { startDate: data.startDate }),
        ...(data.endDate !== undefined && { endDate: data.endDate }),
        ...(data.description !== undefined && { description: data.description }),
      },
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.project.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async existsAssets(projectId: string): Promise<boolean> {
    const count = await prisma.assetProject.count({
      where: { projectId },
    });
    return count > 0;
  }
}

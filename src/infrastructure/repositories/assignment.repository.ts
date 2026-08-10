import { AssetAssignment } from '../../domain/assignments/assignment.entity';
import { prisma } from '../database/prisma.service';
import {
  IAssignmentRepository,
  AssetAssignmentDetail,
  FindAllAssignmentsOptions,
  PaginatedAssignments,
} from '../../domain/assignments/assignment.repository.interface';

export class AssignmentRepository implements IAssignmentRepository {
  async findAll(options: FindAllAssignmentsOptions): Promise<PaginatedAssignments> {
    const page = options.page && options.page > 0 ? options.page : 1;
    const limit = options.limit && options.limit > 0 ? options.limit : 20;
    const skip = (page - 1) * limit;

    const whereCondition: any = {};

    if (options.assetId) {
      whereCondition.assetId = options.assetId;
    }

    if (options.activeOnly) {
      whereCondition.returnedAt = null;
    }

    if (options.search) {
      whereCondition.OR = [
        { responsibleName: { contains: options.search } },
        { position: { contains: options.search } },
        { observations: { contains: options.search } },
        { asset: { code: { contains: options.search } } },
        { asset: { name: { contains: options.search } } },
      ];
    }

    const [total, items] = await Promise.all([
      prisma.assetAssignment.count({ where: whereCondition }),
      prisma.assetAssignment.findMany({
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
              location: { select: { id: true, name: true } },
            },
          },
        },
      }),
    ]);

    return {
      data: items as unknown as AssetAssignmentDetail[],
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async findById(id: string): Promise<AssetAssignmentDetail | null> {
    const item = await prisma.assetAssignment.findUnique({
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

    return item as unknown as AssetAssignmentDetail | null;
  }

  async findActiveAssignmentByAssetId(assetId: string): Promise<AssetAssignment | null> {
    return prisma.assetAssignment.findFirst({
      where: {
        assetId,
        returnedAt: null,
      },
    });
  }

  async findByAssetId(assetId: string): Promise<AssetAssignmentDetail[]> {
    const items = await prisma.assetAssignment.findMany({
      where: { assetId },
      orderBy: { assignedAt: 'desc' },
    });

    return items as unknown as AssetAssignmentDetail[];
  }

  async assign(data: {
    assetId: string;
    responsibleName: string;
    position?: string;
    observations?: string;
  }): Promise<AssetAssignment> {
    return prisma.assetAssignment.create({
      data: {
        assetId: data.assetId,
        responsibleName: data.responsibleName,
        position: data.position || null,
        assignedAt: new Date(),
        returnedAt: null,
        observations: data.observations || null,
      },
    });
  }

  async returnAsset(id: string, observations?: string): Promise<AssetAssignment> {
    return prisma.assetAssignment.update({
      where: { id },
      data: {
        returnedAt: new Date(),
        ...(observations && { observations }),
      },
    });
  }

  async existsAsset(assetId: string): Promise<boolean> {
    const count = await prisma.asset.count({ where: { id: assetId, deletedAt: null } });
    return count > 0;
  }
}

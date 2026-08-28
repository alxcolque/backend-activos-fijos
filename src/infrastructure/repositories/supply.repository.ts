import { prisma } from '../database/prisma.service';
import {
  ISupplyRepository,
  FindAllSuppliesOptions,
  PaginatedSupplies,
  CreateSupplyDto,
  UpdateSupplyDto,
} from '../../domain/supplies/supply.repository.interface';
import { SupplyEntity } from '../../domain/supplies/supply.entity';

export class SupplyRepository implements ISupplyRepository {
  async findAll(options: FindAllSuppliesOptions): Promise<PaginatedSupplies> {
    const page = Math.max(1, Number(options.page || 1));
    const limit = Math.max(1, Math.min(500, Number(options.limit || 10)));
    const skip = (page - 1) * limit;

    const whereConditions: any[] = [];
    if (options.search) {
      whereConditions.push({
        OR: [
          { name: { contains: options.search } },
          { observations: { contains: options.search } },
          { unit: { contains: options.search } },
        ],
      });
    }

    if (options.categoryId) {
      whereConditions.push({ categoryId: options.categoryId });
    }

    if (options.locationId) {
      whereConditions.push({ locationId: options.locationId });
    }

    const whereCondition = whereConditions.length > 0 ? { AND: whereConditions } : {};

    const [total, items] = await Promise.all([
      prisma.supply.count({ where: whereCondition }),
      prisma.supply.findMany({
        where: whereCondition,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          category: { select: { id: true, name: true } },
          location: { select: { id: true, name: true } },
        },
      }),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      data: items as unknown as SupplyEntity[],
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }

  async findById(id: string): Promise<SupplyEntity | null> {
    const item = await prisma.supply.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, name: true } },
        location: { select: { id: true, name: true } },
      },
    });
    return item as unknown as SupplyEntity | null;
  }

  async create(data: CreateSupplyDto): Promise<SupplyEntity> {
    const item = await prisma.supply.create({
      data: {
        name: data.name.trim(),
        categoryId: data.categoryId || null,
        locationId: data.locationId || null,
        unit: data.unit ? data.unit.trim() : 'PZA',
        inputQuantity: Number(data.inputQuantity || 0),
        outputQuantity: Number(data.outputQuantity || 0),
        entryDate: data.entryDate ? new Date(data.entryDate) : null,
        observations: data.observations || null,
      },
      include: {
        category: { select: { id: true, name: true } },
        location: { select: { id: true, name: true } },
      },
    });

    return item as unknown as SupplyEntity;
  }

  async update(id: string, data: UpdateSupplyDto): Promise<SupplyEntity> {
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name.trim();
    if (data.categoryId !== undefined) updateData.categoryId = data.categoryId || null;
    if (data.locationId !== undefined) updateData.locationId = data.locationId || null;
    if (data.unit !== undefined) updateData.unit = data.unit.trim();
    if (data.inputQuantity !== undefined) updateData.inputQuantity = Number(data.inputQuantity);
    if (data.outputQuantity !== undefined) updateData.outputQuantity = Number(data.outputQuantity);
    if (data.entryDate !== undefined) updateData.entryDate = data.entryDate ? new Date(data.entryDate) : null;
    if (data.observations !== undefined) updateData.observations = data.observations || null;

    const item = await prisma.supply.update({
      where: { id },
      data: updateData,
      include: {
        category: { select: { id: true, name: true } },
        location: { select: { id: true, name: true } },
      },
    });

    return item as unknown as SupplyEntity;
  }

  async delete(id: string): Promise<boolean> {
    await prisma.supply.delete({ where: { id } });
    return true;
  }
}

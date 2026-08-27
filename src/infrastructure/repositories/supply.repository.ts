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
    const limit = Math.max(1, Math.min(100, Number(options.limit || 10)));
    const skip = (page - 1) * limit;

    const whereCondition: any = {};
    if (options.search) {
      whereCondition.OR = [
        { name: { contains: options.search } },
        { observations: { contains: options.search } },
        { unit: { contains: options.search } },
      ];
    }

    const [total, items] = await Promise.all([
      prisma.supply.count({ where: whereCondition }),
      prisma.supply.findMany({
        where: whereCondition,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      data: items as SupplyEntity[],
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }

  async findById(id: string): Promise<SupplyEntity | null> {
    const item = await prisma.supply.findUnique({ where: { id } });
    return item as SupplyEntity | null;
  }

  async create(data: CreateSupplyDto): Promise<SupplyEntity> {
    const item = await prisma.supply.create({
      data: {
        name: data.name.trim(),
        unit: data.unit ? data.unit.trim() : 'PZA',
        inputQuantity: Number(data.inputQuantity || 0),
        outputQuantity: Number(data.outputQuantity || 0),
        entryDate: data.entryDate ? new Date(data.entryDate) : null,
        observations: data.observations || null,
      },
    });

    return item as SupplyEntity;
  }

  async update(id: string, data: UpdateSupplyDto): Promise<SupplyEntity> {
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name.trim();
    if (data.unit !== undefined) updateData.unit = data.unit.trim();
    if (data.inputQuantity !== undefined) updateData.inputQuantity = Number(data.inputQuantity);
    if (data.outputQuantity !== undefined) updateData.outputQuantity = Number(data.outputQuantity);
    if (data.entryDate !== undefined) updateData.entryDate = data.entryDate ? new Date(data.entryDate) : null;
    if (data.observations !== undefined) updateData.observations = data.observations || null;

    const item = await prisma.supply.update({
      where: { id },
      data: updateData,
    });

    return item as SupplyEntity;
  }

  async delete(id: string): Promise<boolean> {
    await prisma.supply.delete({ where: { id } });
    return true;
  }
}

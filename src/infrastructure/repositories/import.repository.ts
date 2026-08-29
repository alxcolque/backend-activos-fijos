import { Asset } from '../../domain/assets/asset.entity';
import { prisma } from '../database/prisma.service';
import { IImportRepository } from '../../domain/import/import.repository.interface';

export class ImportRepository implements IImportRepository {
  async findDefaultCategory(): Promise<string> {
    const category = await prisma.assetCategory.findFirst();
    if (category) return category.id;

    const newCategory = await prisma.assetCategory.create({
      data: { name: 'GENERAL', description: 'Categoría General' },
    });
    return newCategory.id;
  }

  async findCategoryByName(name: string): Promise<string | null> {
    const category = await prisma.assetCategory.findFirst({
      where: { name: { equals: name } },
    });
    return category ? category.id : null;
  }

  async createCategory(name: string): Promise<string> {
    const category = await prisma.assetCategory.create({
      data: { name, description: 'Categoría importada' },
    });
    return category.id;
  }

  async findDefaultStatus(): Promise<string> {
    const status = await prisma.assetStatus.findFirst();
    if (status) return status.id;

    const newStatus = await prisma.assetStatus.create({
      data: { name: 'ACTIVO', description: 'Estado Activo' },
    });
    return newStatus.id;
  }

  async findStatusByName(name: string): Promise<string | null> {
    const status = await prisma.assetStatus.findFirst({
      where: { name: { equals: name } },
    });
    return status ? status.id : null;
  }

  async findDefaultLocation(): Promise<string> {
    const location = await prisma.location.findFirst({
      where: { name: 'COMIBOL', deletedAt: null },
    });
    if (location) return location.id;

    const anyLoc = await prisma.location.findFirst({ where: { deletedAt: null } });
    if (anyLoc) return anyLoc.id;

    const newLoc = await prisma.location.create({
      data: { code: 'COMIBOL-MAIN', name: 'COMIBOL', description: 'Oficina Central' } as any,
    });
    return newLoc.id;
  }

  async findLocationByName(name: string): Promise<string | null> {
    const location = await prisma.location.findFirst({
      where: { name: { equals: name }, deletedAt: null },
    });
    return location ? location.id : null;
  }

  async existsCode(code: string): Promise<boolean> {
    const count = await prisma.asset.count({ where: { code } });
    return count > 0;
  }

  async existsSerial(serial: string): Promise<boolean> {
    const count = await prisma.asset.count({ where: { serialNumber: serial } });
    return count > 0;
  }

  async bulkCreateAssets(assetsData: any[]): Promise<Asset[]> {
    const items = await prisma.$transaction(
      assetsData.map((data) =>
        prisma.asset.create({
          data,
        }),
      ),
    );
    return items as unknown as Asset[];
  }
}

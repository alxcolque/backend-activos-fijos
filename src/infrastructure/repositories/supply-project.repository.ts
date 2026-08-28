import { prisma } from '../database/prisma.service';
import {
  ISupplyProjectRepository,
  AssignSupplyToProjectDto,
  ReleaseSupplyFromProjectDto,
} from '../../domain/supply-projects/supply-project.repository.interface';
import { SupplyProjectEntity } from '../../domain/supply-projects/supply-project.entity';

export class SupplyProjectRepository implements ISupplyProjectRepository {
  async findByProjectId(projectId: string): Promise<SupplyProjectEntity[]> {
    const items = await prisma.supplyProject.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      include: {
        supply: {
          include: {
            category: { select: { id: true, name: true } },
            location: { select: { id: true, name: true } },
          },
        },
        project: { select: { id: true, name: true } },
      },
    });

    return items as unknown as SupplyProjectEntity[];
  }

  async findById(id: string): Promise<SupplyProjectEntity | null> {
    const item = await prisma.supplyProject.findUnique({
      where: { id },
      include: {
        supply: {
          include: {
            category: { select: { id: true, name: true } },
            location: { select: { id: true, name: true } },
          },
        },
        project: { select: { id: true, name: true } },
      },
    });

    return item as unknown as SupplyProjectEntity | null;
  }

  async assign(data: AssignSupplyToProjectDto): Promise<SupplyProjectEntity> {
    const quantity = Math.max(1, Number(data.quantity || 1));
    const outputQuantity = Math.max(0, Number(data.outputQuantity || 0));

    if (outputQuantity > quantity) {
      throw new Error(
        `La cantidad de salida del proyecto (${outputQuantity}) no puede superar la cantidad asignada (${quantity}).`
      );
    }

    // Crear la asignación en supply_projects con outputQuantity = 0 por defecto
    const assignment = await prisma.supplyProject.create({
      data: {
        supplyId: data.supplyId,
        projectId: data.projectId,
        quantity,
        outputQuantity,
        observations: data.observations || null,
      },
      include: {
        supply: {
          include: {
            category: { select: { id: true, name: true } },
            location: { select: { id: true, name: true } },
          },
        },
        project: { select: { id: true, name: true } },
      },
    });

    // Incrementar outputQuantity del insumo/suministro en almacén
    await prisma.supply.update({
      where: { id: data.supplyId },
      data: {
        outputQuantity: { increment: quantity },
      },
    });

    return assignment as unknown as SupplyProjectEntity;
  }

  async release(data: ReleaseSupplyFromProjectDto): Promise<SupplyProjectEntity> {
    const existing = await this.findById(data.id);
    if (!existing) {
      throw new Error('Asignación de suministro no encontrada.');
    }

    const availableInProject = Math.max(0, existing.quantity - existing.outputQuantity);
    const releaseQty = data.quantityToRelease
      ? Math.min(existing.quantity, Math.max(1, Number(data.quantityToRelease)))
      : existing.quantity;

    if (releaseQty > existing.quantity) {
      throw new Error(`La cantidad a liberar (${releaseQty}) no puede ser mayor a la cantidad asignada (${existing.quantity}).`);
    }

    const newOutputQuantity = Math.min(existing.quantity, existing.outputQuantity + releaseQty);
    const remainingStockInProject = existing.quantity - newOutputQuantity;

    let updated: any;
    if (remainingStockInProject <= 0) {
      // Liberación total
      updated = await prisma.supplyProject.update({
        where: { id: data.id },
        data: {
          outputQuantity: existing.quantity,
          releasedAt: new Date(),
          observations: data.observations
            ? `${existing.observations || ''} [Liberado: ${new Date().toLocaleDateString()}] - ${data.observations}`.trim()
            : existing.observations,
        },
        include: {
          supply: {
            include: {
              category: { select: { id: true, name: true } },
              location: { select: { id: true, name: true } },
            },
          },
          project: { select: { id: true, name: true } },
        },
      });
    } else {
      // Liberación parcial (incrementa la salida del proyecto)
      updated = await prisma.supplyProject.update({
        where: { id: data.id },
        data: {
          outputQuantity: newOutputQuantity,
          observations: data.observations
            ? `${existing.observations || ''} [Se liberaron ${releaseQty} unid.] - ${data.observations}`.trim()
            : existing.observations,
        },
        include: {
          supply: {
            include: {
              category: { select: { id: true, name: true } },
              location: { select: { id: true, name: true } },
            },
          },
          project: { select: { id: true, name: true } },
        },
      });
    }

    // Decrementar outputQuantity del suministro en almacén general
    await prisma.supply.update({
      where: { id: existing.supplyId },
      data: {
        outputQuantity: { decrement: releaseQty },
      },
    });

    return updated as unknown as SupplyProjectEntity;
  }

  async delete(id: string): Promise<boolean> {
    const existing = await this.findById(id);
    if (existing && !existing.releasedAt) {
      const activeQuantity = Math.max(0, existing.quantity - existing.outputQuantity);
      if (activeQuantity > 0) {
        // Revertir outputQuantity si no estaba liberado previamente
        await prisma.supply.update({
          where: { id: existing.supplyId },
          data: {
            outputQuantity: { decrement: activeQuantity },
          },
        });
      }
    }

    await prisma.supplyProject.delete({ where: { id } });
    return true;
  }
}

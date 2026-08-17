import { prisma } from '../database/prisma.service';
import {
  IDashboardRepository,
  DashboardSummary,
  StatusStat,
  CategoryStat,
  LocationStat,
  RecentAsset,
  RecentActivity,
  DashboardData,
} from '../../domain/dashboard/dashboard.repository.interface';

export class DashboardRepository implements IDashboardRepository {
  async getSummary(): Promise<DashboardSummary> {
    const totalAssets = await prisma.asset.count({
      where: { deletedAt: null },
    });

    const totalValueAgg = await prisma.asset.aggregate({
      where: { deletedAt: null },
      _sum: { currentValue: true },
    });

    const totalValue = Number(totalValueAgg._sum.currentValue || 0);

    const operationalAssets = await prisma.asset.count({
      where: {
        status: { name: 'Activo' },
        deletedAt: null,
      },
    });

    const maintenanceAssets = await prisma.asset.count({
      where: {
        status: { name: 'En mantenimiento' },
        deletedAt: null,
      },
    });

    const inactiveAssets = await prisma.asset.count({
      where: {
        status: { name: { in: ['De baja', 'Fuera de servicio'] } },
        deletedAt: null,
      },
    });

    const totalProjects = await prisma.project.count({
      where: { deletedAt: null },
    });

    const activeProjects = await prisma.project.count({
      where: { status: 'ACTIVE', deletedAt: null },
    });

    const totalQtyAgg = await prisma.asset.aggregate({
      where: { deletedAt: null },
      _sum: { quantity: true, quantityOut: true },
    });

    const totalAssignedQuantity = Number(totalQtyAgg._sum.quantityOut || 0);
    const totalQty = Number(totalQtyAgg._sum.quantity || 0);
    const totalAvailableQuantity = Math.max(0, totalQty - totalAssignedQuantity);

    return {
      totalAssets,
      totalValue,
      operationalAssets,
      maintenanceAssets,
      inactiveAssets,
      totalProjects,
      activeProjects,
      totalAssignedQuantity,
      totalAvailableQuantity,
    };
  }

  async getAssetsByStatus(): Promise<StatusStat[]> {
    const statuses = await prisma.assetStatus.findMany({
      select: {
        name: true,
        _count: {
          select: {
            assets: {
              where: { deletedAt: null },
            },
          },
        },
      },
    });

    return statuses.map((s: any) => ({
      status: s.name,
      count: s._count.assets,
    }));
  }

  async getAssetsByCategory(): Promise<CategoryStat[]> {
    const categories = await prisma.assetCategory.findMany({
      select: {
        id: true,
        name: true,
      },
    });

    const result: CategoryStat[] = [];

    for (const cat of categories) {
      const agg = await prisma.asset.aggregate({
        where: {
          categoryId: cat.id,
          deletedAt: null,
        },
        _count: { id: true },
        _sum: { currentValue: true },
      });

      result.push({
        category: cat.name,
        quantity: agg._count.id,
        value: Number(agg._sum.currentValue || 0),
      });
    }

    return result;
  }

  async getAssetsByLocation(): Promise<LocationStat[]> {
    const locations = await prisma.location.findMany({
      select: {
        name: true,
        _count: {
          select: {
            assets: {
              where: { deletedAt: null },
            },
          },
        },
      },
    });

    return locations.map((l: any) => ({
      location: l.name,
      quantity: l._count.assets,
    }));
  }

  async getRecentAssets(limit = 10): Promise<RecentAsset[]> {
    const assets = await prisma.asset.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        code: true,
        name: true,
        createdAt: true,
      },
    });

    return assets;
  }

  async getRecentActivities(limit = 10): Promise<RecentActivity[]> {
    const assets = await prisma.asset.findMany({
      where: { deletedAt: null },
      orderBy: { updatedAt: 'desc' },
      take: limit,
      select: {
        name: true,
        code: true,
        updatedAt: true,
      },
    });

    return assets.map((a: any) => ({
      action: 'UPDATE',
      description: `Activo ${a.code} - ${a.name} actualizado`,
      date: a.updatedAt,
    }));
  }

  async getDashboardData(): Promise<DashboardData> {
    const [
      summary,
      byStatus,
      byCategory,
      byLocation,
      recentAssets,
      recentActivities,
    ] = await Promise.all([
      this.getSummary(),
      this.getAssetsByStatus(),
      this.getAssetsByCategory(),
      this.getAssetsByLocation(),
      this.getRecentAssets(10),
      this.getRecentActivities(10),
    ]);

    return {
      summary,
      byStatus,
      byCategory,
      byLocation,
      recentAssets,
      recentActivities,
    };
  }
}

import { prisma } from '../database/prisma.service';
import {
  IReportRepository,
  ReportFilterOptions,
  AssetsReportResult,
  DepreciationReportResult,
  DepreciationItem,
  AssignmentsReportResult,
  MaintenancesReportResult,
} from '../../domain/reports/report.repository.interface';

export class ReportRepository implements IReportRepository {
  async getAssetsReport(options: ReportFilterOptions): Promise<AssetsReportResult> {
    const whereCondition: any = { deletedAt: null };

    if (options.category) whereCondition.categoryId = options.category;
    if (options.status) whereCondition.statusId = options.status;
    if (options.location) whereCondition.locationId = options.location;

    if (options.startDate || options.endDate) {
      whereCondition.createdAt = {};
      if (options.startDate) whereCondition.createdAt.gte = new Date(options.startDate);
      if (options.endDate) whereCondition.createdAt.lte = new Date(options.endDate);
    }

    const [totalAssets, agg, items] = await Promise.all([
      prisma.asset.count({ where: whereCondition }),
      prisma.asset.aggregate({
        where: whereCondition,
        _sum: { purchaseValue: true, currentValue: true },
      }),
      prisma.asset.findMany({
        where: whereCondition,
        orderBy: { code: 'asc' },
        include: {
          category: { select: { name: true } },
          status: { select: { name: true } },
          location: { select: { name: true } },
        },
      }),
    ]);

    return {
      summary: {
        totalAssets,
        totalPurchaseValue: Number(agg._sum.purchaseValue || 0),
        totalCurrentValue: Number(agg._sum.currentValue || 0),
      },
      items: items.map((a) => ({
        id: a.id,
        code: a.code,
        qrCode: a.qrCode,
        name: a.name,
        category: a.category.name,
        status: a.status.name,
        location: a.location.name,
        brand: a.brand,
        model: a.model,
        serialNumber: a.serialNumber,
        purchaseValue: a.purchaseValue ? Number(a.purchaseValue) : 0,
        currentValue: a.currentValue ? Number(a.currentValue) : 0,
        createdAt: a.createdAt,
      })),
    };
  }

  async getDepreciationReport(options: ReportFilterOptions): Promise<DepreciationReportResult> {
    const targetYear = options.year || new Date().getFullYear();
    const whereCondition: any = { deletedAt: null };

    if (options.category) whereCondition.categoryId = options.category;

    const assets = await prisma.asset.findMany({
      where: whereCondition,
      orderBy: { code: 'asc' },
      include: {
        category: { select: { name: true } },
      },
    });

    let totalOriginalValue = 0;
    let totalAccumulatedDepreciation = 0;
    let totalNetBookValue = 0;

    const items: DepreciationItem[] = assets.map((a) => {
      const purchaseValue = a.purchaseValue ? Number(a.purchaseValue) : 0;
      const usefulLife = a.usefulLife && a.usefulLife > 0 ? a.usefulLife : 1;
      const purchaseYear = a.purchaseYear || (a.purchaseDate ? new Date(a.purchaseDate).getFullYear() : targetYear);

      const elapsedYears = Math.max(0, targetYear - purchaseYear);
      const annualDepreciation = purchaseValue / usefulLife;
      const accumulatedDepreciation = Math.min(purchaseValue, annualDepreciation * elapsedYears);
      const netBookValue = Math.max(0, purchaseValue - accumulatedDepreciation);

      totalOriginalValue += purchaseValue;
      totalAccumulatedDepreciation += accumulatedDepreciation;
      totalNetBookValue += netBookValue;

      return {
        id: a.id,
        code: a.code,
        name: a.name,
        category: a.category.name,
        purchaseYear,
        purchaseValue,
        usefulLife,
        elapsedYears,
        annualDepreciation: Math.round(annualDepreciation * 100) / 100,
        accumulatedDepreciation: Math.round(accumulatedDepreciation * 100) / 100,
        netBookValue: Math.round(netBookValue * 100) / 100,
      };
    });

    return {
      summary: {
        totalAssets: assets.length,
        totalOriginalValue: Math.round(totalOriginalValue * 100) / 100,
        totalAccumulatedDepreciation: Math.round(totalAccumulatedDepreciation * 100) / 100,
        totalNetBookValue: Math.round(totalNetBookValue * 100) / 100,
      },
      items,
    };
  }

  async getAssignmentsReport(options: ReportFilterOptions): Promise<AssignmentsReportResult> {
    const whereCondition: any = {};
    if (options.activeOnly) whereCondition.returnedAt = null;

    const [totalAssignments, activeAssignments, items] = await Promise.all([
      prisma.assetAssignment.count(),
      prisma.assetAssignment.count({ where: { returnedAt: null } }),
      prisma.assetAssignment.findMany({
        where: whereCondition,
        orderBy: { assignedAt: 'desc' },
        include: {
          asset: {
            select: { id: true, code: true, name: true },
          },
        },
      }),
    ]);

    return {
      summary: {
        totalAssignments,
        activeAssignments,
      },
      items: items.map((i) => ({
        id: i.id,
        responsibleName: i.responsibleName,
        position: i.position,
        assignedAt: i.assignedAt,
        returnedAt: i.returnedAt,
        observations: i.observations,
        assetCode: i.asset.code,
        assetName: i.asset.name,
      })),
    };
  }

  async getMaintenancesReport(options: ReportFilterOptions): Promise<MaintenancesReportResult> {
    const whereCondition: any = {};

    if (options.type) whereCondition.type = options.type;
    if (options.startDate || options.endDate) {
      whereCondition.maintenanceDate = {};
      if (options.startDate) whereCondition.maintenanceDate.gte = new Date(options.startDate);
      if (options.endDate) whereCondition.maintenanceDate.lte = new Date(options.endDate);
    }

    const [items, prevAgg, corrAgg] = await Promise.all([
      prisma.assetMaintenance.findMany({
        where: whereCondition,
        orderBy: { maintenanceDate: 'desc' },
        include: {
          asset: { select: { code: true, name: true } },
        },
      }),
      prisma.assetMaintenance.aggregate({
        where: { ...whereCondition, type: 'PREVENTIVE' },
        _sum: { cost: true },
      }),
      prisma.assetMaintenance.aggregate({
        where: { ...whereCondition, type: 'CORRECTIVE' },
        _sum: { cost: true },
      }),
    ]);

    const preventiveCost = Number(prevAgg._sum.cost || 0);
    const correctiveCost = Number(corrAgg._sum.cost || 0);

    return {
      summary: {
        totalInterventions: items.length,
        totalCost: preventiveCost + correctiveCost,
        preventiveCost,
        correctiveCost,
      },
      items: items.map((m) => ({
        id: m.id,
        assetCode: m.asset.code,
        assetName: m.asset.name,
        type: m.type,
        maintenanceDate: m.maintenanceDate,
        provider: m.provider,
        cost: m.cost ? Number(m.cost) : 0,
        nextMaintenance: m.nextMaintenance,
        observations: m.observations,
      })),
    };
  }
}

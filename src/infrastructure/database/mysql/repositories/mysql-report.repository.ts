import { RowDataPacket } from 'mysql2';
import { mysqlPool } from '../mysql.client';
import {
  IReportRepository,
  ReportFilterOptions,
  AssetsReportResult,
  DepreciationReportResult,
  DepreciationItem,
  AssignmentsReportResult,
  MaintenancesReportResult,
} from '../../../../domain/reports/report.repository.interface';

export class MySQLReportRepository implements IReportRepository {
  async getAssetsReport(options: ReportFilterOptions): Promise<AssetsReportResult> {
    const whereConditions = ['a.deletedAt IS NULL'];
    const params: any[] = [];

    if (options.category) {
      whereConditions.push('a.categoryId = ?');
      params.push(options.category);
    }
    if (options.status) {
      whereConditions.push('a.statusId = ?');
      params.push(options.status);
    }
    if (options.location) {
      whereConditions.push('a.locationId = ?');
      params.push(options.location);
    }
    if (options.startDate) {
      whereConditions.push('a.createdAt >= ?');
      params.push(new Date(options.startDate));
    }
    if (options.endDate) {
      whereConditions.push('a.createdAt <= ?');
      params.push(new Date(options.endDate));
    }

    const whereClause = whereConditions.join(' AND ');

    const countSql = `SELECT COUNT(*) as total, SUM(a.purchaseValue) as totalPurchaseValue, SUM(a.currentValue) as totalCurrentValue FROM assets a WHERE ${whereClause}`;
    const [aggRows] = await mysqlPool.execute<RowDataPacket[]>(countSql, params);

    const totalAssets = Number(aggRows[0]?.total || 0);
    const totalPurchaseValue = Number(aggRows[0]?.totalPurchaseValue || 0);
    const totalCurrentValue = Number(aggRows[0]?.totalCurrentValue || 0);

    const sql = `
      SELECT a.*, c.name AS categoryName, s.name AS statusName, l.name AS locationName
      FROM assets a
      LEFT JOIN asset_categories c ON c.id = a.categoryId
      LEFT JOIN asset_statuses s ON s.id = a.statusId
      LEFT JOIN locations l ON l.id = a.locationId
      WHERE ${whereClause}
      ORDER BY a.code ASC
    `;

    const [rows] = await mysqlPool.execute<RowDataPacket[]>(sql, params);

    return {
      summary: {
        totalAssets,
        totalPurchaseValue,
        totalCurrentValue,
      },
      items: rows.map((a) => ({
        id: a.id,
        code: a.code,
        qrCode: a.qrCode,
        name: a.name,
        category: a.categoryName,
        status: a.statusName,
        location: a.locationName,
        brand: a.brand,
        model: a.model,
        serialNumber: a.serialNumber,
        purchaseValue: a.purchaseValue ? Number(a.purchaseValue) : 0,
        currentValue: a.currentValue ? Number(a.currentValue) : 0,
        createdAt: new Date(a.createdAt),
      })),
    };
  }

  async getDepreciationReport(options: ReportFilterOptions): Promise<DepreciationReportResult> {
    const targetYear = options.year || new Date().getFullYear();
    const whereConditions = ['a.deletedAt IS NULL'];
    const params: any[] = [];

    if (options.category) {
      whereConditions.push('a.categoryId = ?');
      params.push(options.category);
    }

    const sql = `
      SELECT a.*, c.name AS categoryName, c.usefulLife AS categoryUsefulLife
      FROM assets a
      LEFT JOIN asset_categories c ON c.id = a.categoryId
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY a.code ASC
    `;

    const [assets] = await mysqlPool.execute<RowDataPacket[]>(sql, params);

    let totalOriginalValue = 0;
    let totalAccumulatedDepreciation = 0;
    let totalNetBookValue = 0;

    const items: DepreciationItem[] = assets.map((a) => {
      const purchaseValue = a.purchaseValue ? Number(a.purchaseValue) : 0;
      const usefulLife = a.categoryUsefulLife && Number(a.categoryUsefulLife) > 0 ? Number(a.categoryUsefulLife) : 5;
      const purchaseYear = a.purchaseYear ? Number(a.purchaseYear) : (a.purchaseDate ? new Date(a.purchaseDate).getFullYear() : targetYear);

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
        category: a.categoryName,
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
    const whereConditions: string[] = [];
    const params: any[] = [];

    if (options.activeOnly) {
      whereConditions.push('ass.returnedAt IS NULL');
    }

    const whereClause = whereConditions.length ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const [totalRows] = await mysqlPool.execute<RowDataPacket[]>('SELECT COUNT(*) as total FROM asset_assignments');
    const [activeRows] = await mysqlPool.execute<RowDataPacket[]>('SELECT COUNT(*) as active FROM asset_assignments WHERE returnedAt IS NULL');

    const totalAssignments = Number(totalRows[0]?.total || 0);
    const activeAssignments = Number(activeRows[0]?.active || 0);

    const sql = `
      SELECT ass.*, a.code AS assetCode, a.name AS assetName
      FROM asset_assignments ass
      LEFT JOIN assets a ON a.id = ass.assetId
      ${whereClause}
      ORDER BY ass.assignedAt DESC
    `;

    const [rows] = await mysqlPool.execute<RowDataPacket[]>(sql, params);

    return {
      summary: {
        totalAssignments,
        activeAssignments,
      },
      items: rows.map((i) => ({
        id: i.id,
        responsibleName: i.responsibleName,
        position: i.position,
        assignedAt: new Date(i.assignedAt),
        returnedAt: i.returnedAt ? new Date(i.returnedAt) : null,
        observations: i.observations,
        assetCode: i.assetCode,
        assetName: i.assetName,
      })),
    };
  }

  async getMaintenancesReport(options: ReportFilterOptions): Promise<MaintenancesReportResult> {
    const whereConditions: string[] = [];
    const params: any[] = [];

    if (options.type) {
      whereConditions.push('m.type = ?');
      params.push(options.type);
    }
    if (options.startDate) {
      whereConditions.push('m.maintenanceDate >= ?');
      params.push(new Date(options.startDate));
    }
    if (options.endDate) {
      whereConditions.push('m.maintenanceDate <= ?');
      params.push(new Date(options.endDate));
    }

    const whereClause = whereConditions.length ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const sql = `
      SELECT m.*, a.code AS assetCode, a.name AS assetName
      FROM asset_maintenances m
      LEFT JOIN assets a ON a.id = m.assetId
      ${whereClause}
      ORDER BY m.maintenanceDate DESC
    `;

    const [items] = await mysqlPool.execute<RowDataPacket[]>(sql, params);

    const prevWhere = whereConditions.concat(["m.type = 'PREVENTIVE'"]).join(' AND ');
    const [prevRows] = await mysqlPool.execute<RowDataPacket[]>(
      `SELECT SUM(m.cost) as prevCost FROM asset_maintenances m ${prevWhere ? 'WHERE ' + prevWhere : ''}`,
      params,
    );

    const corrWhere = whereConditions.concat(["m.type = 'CORRECTIVE'"]).join(' AND ');
    const [corrRows] = await mysqlPool.execute<RowDataPacket[]>(
      `SELECT SUM(m.cost) as corrCost FROM asset_maintenances m ${corrWhere ? 'WHERE ' + corrWhere : ''}`,
      params,
    );

    const preventiveCost = Number(prevRows[0]?.prevCost || 0);
    const correctiveCost = Number(corrRows[0]?.corrCost || 0);

    return {
      summary: {
        totalInterventions: items.length,
        totalCost: preventiveCost + correctiveCost,
        preventiveCost,
        correctiveCost,
      },
      items: items.map((m) => ({
        id: m.id,
        assetCode: m.assetCode,
        assetName: m.assetName,
        type: m.type,
        maintenanceDate: new Date(m.maintenanceDate),
        provider: m.provider,
        cost: m.cost ? Number(m.cost) : 0,
        nextMaintenance: m.nextMaintenance ? new Date(m.nextMaintenance) : null,
        observations: m.observations,
      })),
    };
  }
}

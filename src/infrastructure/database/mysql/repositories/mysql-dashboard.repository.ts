import { RowDataPacket } from 'mysql2';
import { mysqlPool } from '../mysql.client';
import {
  IDashboardRepository,
  DashboardSummary,
  StatusStat,
  CategoryStat,
  LocationStat,
  RecentAsset,
  RecentActivity,
  DashboardData,
} from '../../../../domain/dashboard/dashboard.repository.interface';

export class MySQLDashboardRepository implements IDashboardRepository {
  async getSummary(): Promise<DashboardSummary> {
    const [totalRows] = await mysqlPool.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as totalAssets, SUM(currentValue) as totalValue FROM assets WHERE deletedAt IS NULL',
    );
    const totalAssets = Number(totalRows[0]?.totalAssets || 0);
    const totalValue = Number(totalRows[0]?.totalValue || 0);

    const [opRows] = await mysqlPool.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as count FROM assets a JOIN asset_statuses s ON s.id = a.statusId WHERE s.name = 'Activo' AND a.deletedAt IS NULL`,
    );
    const operationalAssets = Number(opRows[0]?.count || 0);

    const [maintRows] = await mysqlPool.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as count FROM assets a JOIN asset_statuses s ON s.id = a.statusId WHERE s.name = 'En mantenimiento' AND a.deletedAt IS NULL`,
    );
    const maintenanceAssets = Number(maintRows[0]?.count || 0);

    const [inactRows] = await mysqlPool.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as count FROM assets a JOIN asset_statuses s ON s.id = a.statusId WHERE s.name IN ('De baja', 'Fuera de servicio') AND a.deletedAt IS NULL`,
    );
    const inactiveAssets = Number(inactRows[0]?.count || 0);

    const [projRows] = await mysqlPool.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as total, SUM(CASE WHEN status = "ACTIVE" THEN 1 ELSE 0 END) as active FROM projects WHERE deletedAt IS NULL',
    );
    const totalProjects = Number(projRows[0]?.total || 0);
    const activeProjects = Number(projRows[0]?.active || 0);

    const [qtyRows] = await mysqlPool.execute<RowDataPacket[]>(
      'SELECT SUM(quantity) as totalQty, SUM(quantity_out) as totalAssigned FROM assets WHERE deletedAt IS NULL',
    );
    const totalAssignedQuantity = Number(qtyRows[0]?.totalAssigned || 0);
    const totalQty = Number(qtyRows[0]?.totalQty || 0);
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
    const sql = `
      SELECT s.name AS status, COUNT(a.id) AS count
      FROM asset_statuses s
      LEFT JOIN assets a ON a.statusId = s.id AND a.deletedAt IS NULL
      GROUP BY s.id, s.name
      ORDER BY s.name ASC
    `;
    const [rows] = await mysqlPool.execute<RowDataPacket[]>(sql);

    return rows.map((r) => ({
      status: r.status,
      count: Number(r.count || 0),
    }));
  }

  async getAssetsByCategory(): Promise<CategoryStat[]> {
    const sql = `
      SELECT c.name AS category, COUNT(a.id) AS quantity, SUM(a.currentValue) AS value
      FROM asset_categories c
      LEFT JOIN assets a ON a.categoryId = c.id AND a.deletedAt IS NULL
      GROUP BY c.id, c.name
      ORDER BY c.name ASC
    `;
    const [rows] = await mysqlPool.execute<RowDataPacket[]>(sql);

    return rows.map((r) => ({
      category: r.category,
      quantity: Number(r.quantity || 0),
      value: Number(r.value || 0),
    }));
  }

  async getAssetsByLocation(): Promise<LocationStat[]> {
    const sql = `
      SELECT l.name AS location, COUNT(a.id) AS quantity
      FROM locations l
      LEFT JOIN assets a ON a.locationId = l.id AND a.deletedAt IS NULL
      WHERE l.deletedAt IS NULL
      GROUP BY l.id, l.name
      ORDER BY l.name ASC
    `;
    const [rows] = await mysqlPool.execute<RowDataPacket[]>(sql);

    return rows.map((r) => ({
      location: r.location,
      quantity: Number(r.quantity || 0),
    }));
  }

  async getRecentAssets(limit = 10): Promise<RecentAsset[]> {
    const [rows] = await mysqlPool.execute<RowDataPacket[]>(
      'SELECT id, code, name, createdAt FROM assets WHERE deletedAt IS NULL ORDER BY createdAt DESC LIMIT ?',
      [limit],
    );

    return rows.map((r) => ({
      id: r.id,
      code: r.code,
      name: r.name,
      createdAt: new Date(r.createdAt),
    }));
  }

  async getRecentActivities(limit = 10): Promise<RecentActivity[]> {
    const [rows] = await mysqlPool.execute<RowDataPacket[]>(
      'SELECT code, name, updatedAt FROM assets WHERE deletedAt IS NULL ORDER BY updatedAt DESC LIMIT ?',
      [limit],
    );

    return rows.map((r) => ({
      action: 'UPDATE',
      description: `Activo ${r.code} - ${r.name} actualizado`,
      date: new Date(r.updatedAt),
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

import { RowDataPacket } from 'mysql2';
import { v4 as uuidv4 } from 'uuid';
import { mysqlPool } from '../mysql.client';
import { AssetMaintenance } from '../../../../domain/maintenances/maintenance.entity';
import { MaintenanceType } from '../../../../domain/enums/maintenance-type.enum';
import {
  IMaintenanceRepository,
  AssetMaintenanceDetail,
  FindAllMaintenancesOptions,
  PaginatedMaintenances,
  CreateMaintenanceDto,
  UpdateMaintenanceDto,
} from '../../../../domain/maintenances/maintenance.repository.interface';

export class MySQLMaintenanceRepository implements IMaintenanceRepository {
  private mapRow(row: any): AssetMaintenance {
    return {
      id: row.id,
      assetId: row.assetId,
      type: row.type as MaintenanceType,
      maintenanceDate: new Date(row.maintenanceDate),
      provider: row.provider || null,
      cost: row.cost !== null && row.cost !== undefined ? Number(row.cost) : null,
      nextMaintenance: row.nextMaintenance ? new Date(row.nextMaintenance) : null,
      observations: row.observations || null,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    };
  }

  async findAll(options: FindAllMaintenancesOptions): Promise<PaginatedMaintenances> {
    const page = options.page && options.page > 0 ? options.page : 1;
    const limit = options.limit && options.limit > 0 ? options.limit : 20;
    const offset = (page - 1) * limit;

    const whereConditions: string[] = [];
    const params: any[] = [];

    if (options.assetId) {
      whereConditions.push('m.assetId = ?');
      params.push(options.assetId);
    }
    if (options.type) {
      whereConditions.push('m.type = ?');
      params.push(options.type);
    }
    if (options.search) {
      whereConditions.push('(m.provider LIKE ? OR m.observations LIKE ? OR a.code LIKE ? OR a.name LIKE ?)');
      const s = `%${options.search}%`;
      params.push(s, s, s, s);
    }

    const whereClause = whereConditions.length ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const countSql = `
      SELECT COUNT(*) as total
      FROM asset_maintenances m
      LEFT JOIN assets a ON a.id = m.assetId
      ${whereClause}
    `;
    const [countRows] = await mysqlPool.execute<RowDataPacket[]>(countSql, params);
    const total = Number(countRows[0]?.total || 0);

    const sql = `
      SELECT m.*,
             a.code AS assetCode, a.name AS assetName,
             c.id AS categoryId, c.name AS categoryName,
             st.id AS statusId, st.name AS statusName,
             loc.id AS locationId, loc.name AS locationName
      FROM asset_maintenances m
      LEFT JOIN assets a ON a.id = m.assetId
      LEFT JOIN asset_categories c ON c.id = a.categoryId
      LEFT JOIN asset_statuses st ON st.id = a.statusId
      LEFT JOIN locations loc ON loc.id = a.locationId
      ${whereClause}
      ORDER BY m.maintenanceDate DESC
      LIMIT ? OFFSET ?
    `;

    const [rows] = await mysqlPool.execute<RowDataPacket[]>(sql, [...params, limit, offset]);

    const data: AssetMaintenanceDetail[] = rows.map((row) => ({
      ...this.mapRow(row),
      asset: {
        id: row.assetId,
        code: row.assetCode,
        name: row.assetName,
        category: row.categoryId ? { id: row.categoryId, name: row.categoryName } : undefined,
        status: row.statusId ? { id: row.statusId, name: row.statusName } : undefined,
        location: row.locationId ? { id: row.locationId, name: row.locationName } : undefined,
      },
    }));

    return {
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async findById(id: string): Promise<AssetMaintenanceDetail | null> {
    const sql = `
      SELECT m.*,
             a.code AS assetCode, a.name AS assetName,
             c.id AS categoryId, c.name AS categoryName,
             st.id AS statusId, st.name AS statusName,
             loc.id AS locationId, loc.name AS locationName
      FROM asset_maintenances m
      LEFT JOIN assets a ON a.id = m.assetId
      LEFT JOIN asset_categories c ON c.id = a.categoryId
      LEFT JOIN asset_statuses st ON st.id = a.statusId
      LEFT JOIN locations loc ON loc.id = a.locationId
      WHERE m.id = ?
      LIMIT 1
    `;

    const [rows] = await mysqlPool.execute<RowDataPacket[]>(sql, [id]);
    if (!rows.length) return null;

    const row = rows[0];
    return {
      ...this.mapRow(row),
      asset: {
        id: row.assetId,
        code: row.assetCode,
        name: row.assetName,
        category: row.categoryId ? { id: row.categoryId, name: row.categoryName } : undefined,
        status: row.statusId ? { id: row.statusId, name: row.statusName } : undefined,
        location: row.locationId ? { id: row.locationId, name: row.locationName } : undefined,
      },
    };
  }

  async findByAssetId(assetId: string, type?: MaintenanceType): Promise<AssetMaintenanceDetail[]> {
    const whereConditions = ['assetId = ?'];
    const params: any[] = [assetId];

    if (type) {
      whereConditions.push('type = ?');
      params.push(type);
    }

    const [rows] = await mysqlPool.execute<RowDataPacket[]>(
      `SELECT * FROM asset_maintenances WHERE ${whereConditions.join(' AND ')} ORDER BY maintenanceDate DESC`,
      params,
    );

    return rows.map((r) => this.mapRow(r) as AssetMaintenanceDetail);
  }

  async create(data: CreateMaintenanceDto): Promise<AssetMaintenance> {
    const id = uuidv4();
    const now = new Date();
    const type = data.type || MaintenanceType.PREVENTIVE;

    await mysqlPool.execute(
      `INSERT INTO asset_maintenances (
        id, assetId, type, maintenanceDate, provider, cost, nextMaintenance, observations, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.assetId,
        type,
        data.maintenanceDate,
        data.provider || null,
        data.cost !== undefined ? data.cost : null,
        data.nextMaintenance || null,
        data.observations || null,
        now,
        now,
      ],
    );

    return {
      id,
      assetId: data.assetId,
      type,
      maintenanceDate: data.maintenanceDate,
      provider: data.provider || null,
      cost: data.cost !== undefined ? data.cost : null,
      nextMaintenance: data.nextMaintenance || null,
      observations: data.observations || null,
      createdAt: now,
      updatedAt: now,
    };
  }

  async update(id: string, data: UpdateMaintenanceDto): Promise<AssetMaintenance> {
    const now = new Date();
    const updates: string[] = ['updatedAt = ?'];
    const params: any[] = [now];

    if (data.type !== undefined) { updates.push('type = ?'); params.push(data.type); }
    if (data.maintenanceDate !== undefined) { updates.push('maintenanceDate = ?'); params.push(data.maintenanceDate); }
    if (data.provider !== undefined) { updates.push('provider = ?'); params.push(data.provider || null); }
    if (data.cost !== undefined) { updates.push('cost = ?'); params.push(data.cost || null); }
    if (data.nextMaintenance !== undefined) { updates.push('nextMaintenance = ?'); params.push(data.nextMaintenance || null); }
    if (data.observations !== undefined) { updates.push('observations = ?'); params.push(data.observations || null); }

    params.push(id);

    await mysqlPool.execute(
      `UPDATE asset_maintenances SET ${updates.join(', ')} WHERE id = ?`,
      params,
    );

    const updated = await this.findById(id);
    if (!updated) throw new Error(`AssetMaintenance with id ${id} not found after update`);
    return updated;
  }

  async delete(id: string): Promise<void> {
    await mysqlPool.execute('DELETE FROM asset_maintenances WHERE id = ?', [id]);
  }

  async existsAsset(assetId: string): Promise<boolean> {
    const [rows] = await mysqlPool.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as total FROM assets WHERE id = ? AND deletedAt IS NULL',
      [assetId],
    );
    return Number(rows[0]?.total || 0) > 0;
  }
}

import { RowDataPacket } from 'mysql2';
import { v4 as uuidv4 } from 'uuid';
import { mysqlPool } from '../mysql.client';
import { AssetAssignment } from '../../../../domain/assignments/assignment.entity';
import {
  IAssignmentRepository,
  AssetAssignmentDetail,
  FindAllAssignmentsOptions,
  PaginatedAssignments,
} from '../../../../domain/assignments/assignment.repository.interface';

export class MySQLAssignmentRepository implements IAssignmentRepository {
  private mapRow(row: any): AssetAssignment {
    return {
      id: row.id,
      assetId: row.assetId,
      responsibleName: row.responsibleName,
      position: row.position || null,
      assignedAt: new Date(row.assignedAt),
      returnedAt: row.returnedAt ? new Date(row.returnedAt) : null,
      observations: row.observations || null,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    };
  }

  async findAll(options: FindAllAssignmentsOptions): Promise<PaginatedAssignments> {
    const page = options.page && options.page > 0 ? options.page : 1;
    const limit = options.limit && options.limit > 0 ? options.limit : 20;
    const offset = (page - 1) * limit;

    const whereConditions: string[] = [];
    const params: any[] = [];

    if (options.assetId) {
      whereConditions.push('ass.assetId = ?');
      params.push(options.assetId);
    }
    if (options.activeOnly) {
      whereConditions.push('ass.returnedAt IS NULL');
    }
    if (options.search) {
      whereConditions.push('(ass.responsibleName LIKE ? OR ass.position LIKE ? OR ass.observations LIKE ? OR a.code LIKE ? OR a.name LIKE ?)');
      const s = `%${options.search}%`;
      params.push(s, s, s, s, s);
    }

    const whereClause = whereConditions.length ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const countSql = `
      SELECT COUNT(*) as total
      FROM asset_assignments ass
      LEFT JOIN assets a ON a.id = ass.assetId
      ${whereClause}
    `;
    const [countRows] = await mysqlPool.query<RowDataPacket[]>(countSql, params);
    const total = Number(countRows[0]?.total || 0);

    const sql = `
      SELECT ass.*,
             a.code AS assetCode, a.name AS assetName,
             c.id AS categoryId, c.name AS categoryName,
             st.id AS statusId, st.name AS statusName,
             loc.id AS locationId, loc.name AS locationName
      FROM asset_assignments ass
      LEFT JOIN assets a ON a.id = ass.assetId
      LEFT JOIN asset_categories c ON c.id = a.categoryId
      LEFT JOIN asset_statuses st ON st.id = a.statusId
      LEFT JOIN locations loc ON loc.id = a.locationId
      ${whereClause}
      ORDER BY ass.assignedAt DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const [rows] = await mysqlPool.query<RowDataPacket[]>(sql, params);

    const data: AssetAssignmentDetail[] = rows.map((row) => ({
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

  async findById(id: string): Promise<AssetAssignmentDetail | null> {
    const sql = `
      SELECT ass.*,
             a.code AS assetCode, a.name AS assetName,
             c.id AS categoryId, c.name AS categoryName,
             st.id AS statusId, st.name AS statusName,
             loc.id AS locationId, loc.name AS locationName
      FROM asset_assignments ass
      LEFT JOIN assets a ON a.id = ass.assetId
      LEFT JOIN asset_categories c ON c.id = a.categoryId
      LEFT JOIN asset_statuses st ON st.id = a.statusId
      LEFT JOIN locations loc ON loc.id = a.locationId
      WHERE ass.id = ?
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

  async findActiveAssignmentByAssetId(assetId: string): Promise<AssetAssignment | null> {
    const [rows] = await mysqlPool.execute<RowDataPacket[]>(
      'SELECT * FROM asset_assignments WHERE assetId = ? AND returnedAt IS NULL LIMIT 1',
      [assetId],
    );
    if (!rows.length) return null;
    return this.mapRow(rows[0]);
  }

  async findByAssetId(assetId: string): Promise<AssetAssignmentDetail[]> {
    const [rows] = await mysqlPool.execute<RowDataPacket[]>(
      'SELECT * FROM asset_assignments WHERE assetId = ? ORDER BY assignedAt DESC',
      [assetId],
    );
    return rows.map((r) => this.mapRow(r) as AssetAssignmentDetail);
  }

  async assign(data: {
    assetId: string;
    responsibleName: string;
    position?: string;
    observations?: string;
  }): Promise<AssetAssignment> {
    const id = uuidv4();
    const now = new Date();

    await mysqlPool.execute(
      `INSERT INTO asset_assignments (
        id, assetId, responsibleName, position, assignedAt, returnedAt, observations, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.assetId,
        data.responsibleName,
        data.position || null,
        now,
        null,
        data.observations || null,
        now,
        now,
      ],
    );

    return {
      id,
      assetId: data.assetId,
      responsibleName: data.responsibleName,
      position: data.position || null,
      assignedAt: now,
      returnedAt: null,
      observations: data.observations || null,
      createdAt: now,
      updatedAt: now,
    };
  }

  async returnAsset(id: string, observations?: string): Promise<AssetAssignment> {
    const now = new Date();
    const updates = ['returnedAt = ?', 'updatedAt = ?'];
    const params: any[] = [now, now];

    if (observations) {
      updates.push('observations = ?');
      params.push(observations);
    }
    params.push(id);

    await mysqlPool.execute(
      `UPDATE asset_assignments SET ${updates.join(', ')} WHERE id = ?`,
      params,
    );

    const updated = await this.findById(id);
    if (!updated) throw new Error(`AssetAssignment with id ${id} not found after return`);
    return updated;
  }

  async existsAsset(assetId: string): Promise<boolean> {
    const [rows] = await mysqlPool.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as total FROM assets WHERE id = ? AND deletedAt IS NULL',
      [assetId],
    );
    return Number(rows[0]?.total || 0) > 0;
  }
}

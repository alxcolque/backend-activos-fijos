import { RowDataPacket } from 'mysql2';
import { v4 as uuidv4 } from 'uuid';
import { mysqlPool } from '../mysql.client';
import { AssetProject } from '../../../../domain/asset-projects/asset-project.entity';
import {
  IAssetProjectRepository,
  AssetProjectDetail,
  FindAllAssetProjectsOptions,
  PaginatedAssetProjects,
} from '../../../../domain/asset-projects/asset-project.repository.interface';

export class MySQLAssetProjectRepository implements IAssetProjectRepository {
  private mapRow(row: any): AssetProject {
    return {
      id: row.id,
      assetId: row.assetId,
      projectId: row.projectId,
      assignedAt: new Date(row.assignedAt),
      releasedAt: row.releasedAt ? new Date(row.releasedAt) : null,
      observations: row.observations || null,
    };
  }

  async findAll(options: FindAllAssetProjectsOptions): Promise<PaginatedAssetProjects> {
    const page = options.page && options.page > 0 ? options.page : 1;
    const limit = options.limit && options.limit > 0 ? options.limit : 20;
    const offset = (page - 1) * limit;

    const whereConditions: string[] = [];
    const params: any[] = [];

    if (options.projectId) {
      whereConditions.push('ap.projectId = ?');
      params.push(options.projectId);
    }
    if (options.assetId) {
      whereConditions.push('ap.assetId = ?');
      params.push(options.assetId);
    }
    if (options.activeOnly) {
      whereConditions.push('ap.releasedAt IS NULL');
    }

    const whereClause = whereConditions.length ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const countSql = `SELECT COUNT(*) as total FROM asset_projects ap ${whereClause}`;
    const [countRows] = await mysqlPool.execute<RowDataPacket[]>(countSql, params);
    const total = Number(countRows[0]?.total || 0);

    const sql = `
      SELECT ap.*,
             a.code AS assetCode, a.name AS assetName,
             c.id AS categoryId, c.name AS categoryName,
             s.id AS statusId, s.name AS statusName,
             p.name AS projectName, p.address AS projectAddress, p.responsible AS projectResponsible, p.status AS projectStatus
      FROM asset_projects ap
      LEFT JOIN assets a ON a.id = ap.assetId
      LEFT JOIN asset_categories c ON c.id = a.categoryId
      LEFT JOIN asset_statuses s ON s.id = a.statusId
      LEFT JOIN projects p ON p.id = ap.projectId
      ${whereClause}
      ORDER BY ap.assignedAt DESC
      LIMIT ? OFFSET ?
    `;

    const [rows] = await mysqlPool.execute<RowDataPacket[]>(sql, [...params, limit, offset]);

    const data: AssetProjectDetail[] = rows.map((row) => ({
      id: row.id,
      assetId: row.assetId,
      projectId: row.projectId,
      assignedAt: new Date(row.assignedAt),
      releasedAt: row.releasedAt ? new Date(row.releasedAt) : null,
      observations: row.observations || null,
      asset: {
        id: row.assetId,
        code: row.assetCode,
        name: row.assetName,
        category: row.categoryId ? { id: row.categoryId, name: row.categoryName } : undefined,
        status: row.statusId ? { id: row.statusId, name: row.statusName } : undefined,
      },
      project: {
        id: row.projectId,
        code: row.projectId,
        name: row.projectName,
        type: 'PROJECT',
        status: row.projectStatus,
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

  async findActiveAssignmentByAssetId(assetId: string): Promise<AssetProject | null> {
    const [rows] = await mysqlPool.execute<RowDataPacket[]>(
      'SELECT * FROM asset_projects WHERE assetId = ? AND releasedAt IS NULL LIMIT 1',
      [assetId],
    );
    if (!rows.length) return null;
    return this.mapRow(rows[0]);
  }

  async findActiveAssignment(assetId: string, projectId: string): Promise<AssetProject | null> {
    const [rows] = await mysqlPool.execute<RowDataPacket[]>(
      'SELECT * FROM asset_projects WHERE assetId = ? AND projectId = ? AND releasedAt IS NULL LIMIT 1',
      [assetId, projectId],
    );
    if (!rows.length) return null;
    return this.mapRow(rows[0]);
  }

  async findByProjectId(projectId: string, activeOnly = false): Promise<AssetProjectDetail[]> {
    const whereConditions = ['ap.projectId = ?'];
    const params: any[] = [projectId];

    if (activeOnly) {
      whereConditions.push('ap.releasedAt IS NULL');
    }

    const sql = `
      SELECT ap.*,
             a.code AS assetCode, a.name AS assetName,
             c.id AS categoryId, c.name AS categoryName,
             s.id AS statusId, s.name AS statusName
      FROM asset_projects ap
      LEFT JOIN assets a ON a.id = ap.assetId
      LEFT JOIN asset_categories c ON c.id = a.categoryId
      LEFT JOIN asset_statuses s ON s.id = a.statusId
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY ap.assignedAt DESC
    `;

    const [rows] = await mysqlPool.execute<RowDataPacket[]>(sql, params);

    return rows.map((row) => ({
      id: row.id,
      assetId: row.assetId,
      projectId: row.projectId,
      assignedAt: new Date(row.assignedAt),
      releasedAt: row.releasedAt ? new Date(row.releasedAt) : null,
      observations: row.observations || null,
      asset: {
        id: row.assetId,
        code: row.assetCode,
        name: row.assetName,
        category: row.categoryId ? { id: row.categoryId, name: row.categoryName } : undefined,
        status: row.statusId ? { id: row.statusId, name: row.statusName } : undefined,
      },
    }));
  }

  async findByAssetId(assetId: string): Promise<AssetProjectDetail[]> {
    const sql = `
      SELECT ap.*,
             p.name AS projectName, p.address AS projectAddress, p.responsible AS projectResponsible, p.status AS projectStatus
      FROM asset_projects ap
      LEFT JOIN projects p ON p.id = ap.projectId
      WHERE ap.assetId = ?
      ORDER BY ap.assignedAt DESC
    `;

    const [rows] = await mysqlPool.execute<RowDataPacket[]>(sql, [assetId]);

    return rows.map((row) => ({
      id: row.id,
      assetId: row.assetId,
      projectId: row.projectId,
      assignedAt: new Date(row.assignedAt),
      releasedAt: row.releasedAt ? new Date(row.releasedAt) : null,
      observations: row.observations || null,
      project: {
        id: row.projectId,
        code: row.projectId,
        name: row.projectName,
        type: 'PROJECT',
        status: row.projectStatus,
      },
    }));
  }

  async assign(data: { assetId: string; projectId: string; observations?: string }): Promise<AssetProject> {
    const id = uuidv4();
    const now = new Date();

    await mysqlPool.execute(
      'INSERT INTO asset_projects (id, assetId, projectId, assignedAt, releasedAt, observations) VALUES (?, ?, ?, ?, ?, ?)',
      [id, data.assetId, data.projectId, now, null, data.observations || null],
    );

    return {
      id,
      assetId: data.assetId,
      projectId: data.projectId,
      assignedAt: now,
      releasedAt: null,
      observations: data.observations || null,
    };
  }

  async release(id: string, observations?: string): Promise<AssetProject> {
    const now = new Date();
    const updates = ['releasedAt = ?'];
    const params: any[] = [now];

    if (observations) {
      updates.push('observations = ?');
      params.push(observations);
    }
    params.push(id);

    await mysqlPool.execute(
      `UPDATE asset_projects SET ${updates.join(', ')} WHERE id = ?`,
      params,
    );

    const [rows] = await mysqlPool.execute<RowDataPacket[]>(
      'SELECT * FROM asset_projects WHERE id = ? LIMIT 1',
      [id],
    );

    if (!rows.length) throw new Error(`AssetProject with id ${id} not found after release`);
    return this.mapRow(rows[0]);
  }

  async existsAsset(assetId: string): Promise<boolean> {
    const [rows] = await mysqlPool.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as total FROM assets WHERE id = ? AND deletedAt IS NULL',
      [assetId],
    );
    return Number(rows[0]?.total || 0) > 0;
  }

  async findProjectStatus(projectId: string): Promise<{ exists: boolean; status?: string; name?: string }> {
    const [rows] = await mysqlPool.execute<RowDataPacket[]>(
      'SELECT id, status, name FROM projects WHERE id = ? AND deletedAt IS NULL LIMIT 1',
      [projectId],
    );

    if (!rows.length) return { exists: false };
    return {
      exists: true,
      status: rows[0].status,
      name: rows[0].name,
    };
  }
}

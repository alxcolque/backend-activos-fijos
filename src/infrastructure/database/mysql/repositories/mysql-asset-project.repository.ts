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
      quantity: Number(row.quantity ?? 1),
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
      quantity: Number(row.quantity ?? 1),
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
             a.code AS assetCode, a.name AS assetName, a.brand AS assetBrand, a.model AS assetModel, a.serialNumber AS assetSerial, a.unit AS assetUnit, a.quantity AS assetQuantity, a.quantity_out AS assetQuantityOut,
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
      quantity: Number(row.quantity ?? 1),
      assignedAt: new Date(row.assignedAt),
      releasedAt: row.releasedAt ? new Date(row.releasedAt) : null,
      observations: row.observations || null,
      asset: {
        id: row.assetId,
        code: row.assetCode || 'S/C',
        name: row.assetName || 'Activo Fijo',
        brand: row.assetBrand || null,
        model: row.assetModel || null,
        serialNumber: row.assetSerial || null,
        unit: row.assetUnit || 'PZA',
        quantity: Number(row.assetQuantity || 1),
        quantityOut: Number(row.assetQuantityOut || 0),
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
      quantity: Number(row.quantity ?? 1),
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

  async assign(data: { assetId: string; projectId: string; quantity?: number; observations?: string }): Promise<AssetProject> {
    const id = uuidv4();
    const now = new Date();
    const qty = data.quantity && data.quantity > 0 ? data.quantity : 1;

    await mysqlPool.execute(
      'INSERT INTO asset_projects (id, assetId, projectId, quantity, assignedAt, releasedAt, observations) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, data.assetId, data.projectId, qty, now, null, data.observations || null],
    );

    await mysqlPool.execute(
      'UPDATE assets SET quantity_out = quantity_out + ? WHERE id = ?',
      [qty, data.assetId],
    );

    return {
      id,
      assetId: data.assetId,
      projectId: data.projectId,
      quantity: qty,
      assignedAt: now,
      releasedAt: null,
      observations: data.observations || null,
    };
  }

  async release(id: string, observations?: string, quantityToRelease?: number): Promise<AssetProject> {
    const now = new Date();
    const [currentRows] = await mysqlPool.execute<RowDataPacket[]>(
      'SELECT * FROM asset_projects WHERE id = ? LIMIT 1',
      [id],
    );
    if (!currentRows.length) throw new Error(`AssetProject with id ${id} not found`);
    const current = currentRows[0];
    const totalQty = Number(current.quantity || 1);
    const qtyToRelease = quantityToRelease && quantityToRelease > 0 && quantityToRelease <= totalQty ? quantityToRelease : totalQty;

    if (qtyToRelease < totalQty) {
      // Liberación parcial: reducir la cantidad asignada activa y crear un registro liberado
      const remainingQty = totalQty - qtyToRelease;
      await mysqlPool.execute(
        'UPDATE asset_projects SET quantity = ? WHERE id = ?',
        [remainingQty, id],
      );

      const releasedId = uuidv4();
      await mysqlPool.execute(
        'INSERT INTO asset_projects (id, assetId, projectId, quantity, assignedAt, releasedAt, observations) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [releasedId, current.assetId, current.projectId, qtyToRelease, current.assignedAt, now, observations || current.observations || null],
      );

      await mysqlPool.execute(
        'UPDATE assets SET quantity_out = GREATEST(0, quantity_out - ?) WHERE id = ?',
        [qtyToRelease, current.assetId],
      );

      const [rows] = await mysqlPool.execute<RowDataPacket[]>(
        'SELECT * FROM asset_projects WHERE id = ? LIMIT 1',
        [releasedId],
      );
      return this.mapRow(rows[0]);
    } else {
      // Liberación total del registro
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

      await mysqlPool.execute(
        'UPDATE assets SET quantity_out = GREATEST(0, quantity_out - ?) WHERE id = ?',
        [totalQty, current.assetId],
      );

      const [rows] = await mysqlPool.execute<RowDataPacket[]>(
        'SELECT * FROM asset_projects WHERE id = ? LIMIT 1',
        [id],
      );

      if (!rows.length) throw new Error(`AssetProject with id ${id} not found after release`);
      return this.mapRow(rows[0]);
    }
  }

  async findById(id: string): Promise<AssetProject | null> {
    const [rows] = await mysqlPool.execute<RowDataPacket[]>(
      'SELECT * FROM asset_projects WHERE id = ? LIMIT 1',
      [id],
    );
    if (!rows.length) return null;
    return this.mapRow(rows[0]);
  }

  async deleteAssignment(id: string): Promise<boolean> {
    const [currentRows] = await mysqlPool.execute<RowDataPacket[]>(
      'SELECT * FROM asset_projects WHERE id = ? LIMIT 1',
      [id],
    );
    if (!currentRows.length) return false;
    const current = currentRows[0];

    // Si la asignación aún no había sido liberada, devolvemos la cantidad a quantity_out de assets
    if (!current.releasedAt) {
      const qty = Number(current.quantity || 1);
      await mysqlPool.execute(
        'UPDATE assets SET quantity_out = GREATEST(0, quantity_out - ?) WHERE id = ?',
        [qty, current.assetId],
      );
    }

    await mysqlPool.execute('DELETE FROM asset_projects WHERE id = ?', [id]);
    return true;
  }

  async existsAsset(assetId: string): Promise<boolean> {
    const [rows] = await mysqlPool.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as total FROM assets WHERE id = ? AND deletedAt IS NULL',
      [assetId],
    );
    return Number(rows[0]?.total || 0) > 0;
  }

  async getAssetStock(assetId: string): Promise<{ exists: boolean; name?: string; code?: string; quantity?: number; quantityOut?: number; available?: number }> {
    const [rows] = await mysqlPool.execute<RowDataPacket[]>(
      'SELECT id, name, code, quantity, quantity_out FROM assets WHERE id = ? AND deletedAt IS NULL LIMIT 1',
      [assetId],
    );
    if (!rows.length) return { exists: false };
    const r = rows[0];
    const qty = Number(r.quantity || 1);
    const out = Number(r.quantity_out || 0);
    return {
      exists: true,
      name: r.name,
      code: r.code,
      quantity: qty,
      quantityOut: out,
      available: Math.max(0, qty - out),
    };
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

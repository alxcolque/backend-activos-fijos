import { RowDataPacket } from 'mysql2';
import { v4 as uuidv4 } from 'uuid';
import { mysqlPool } from '../mysql.client';
import { AssetStatus } from '../../../../domain/status/status.entity';
import {
  IStatusRepository,
  StatusWithCount,
} from '../../../../domain/status/status.repository.interface';

export class MySQLStatusRepository implements IStatusRepository {
  async findAll(search?: string): Promise<StatusWithCount[]> {
    let sql = `
      SELECT s.id, s.name, s.description, s.createdAt, s.updatedAt,
             COUNT(a.id) AS totalAssets
      FROM asset_statuses s
      LEFT JOIN assets a ON a.statusId = s.id AND a.deletedAt IS NULL
    `;
    const params: any[] = [];

    if (search) {
      sql += ` WHERE s.name LIKE ? OR s.description LIKE ?`;
      params.push(`%${search}%`, `%${search}%`);
    }

    sql += ` GROUP BY s.id ORDER BY s.name ASC`;

    const [rows] = await mysqlPool.execute<RowDataPacket[]>(sql, params);

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
      totalAssets: Number(row.totalAssets || 0),
    }));
  }

  async findById(id: string): Promise<StatusWithCount | null> {
    const sql = `
      SELECT s.id, s.name, s.description, s.createdAt, s.updatedAt,
             COUNT(a.id) AS totalAssets
      FROM asset_statuses s
      LEFT JOIN assets a ON a.statusId = s.id AND a.deletedAt IS NULL
      WHERE s.id = ?
      GROUP BY s.id
      LIMIT 1
    `;

    const [rows] = await mysqlPool.execute<RowDataPacket[]>(sql, [id]);
    if (!rows.length) return null;

    const row = rows[0];
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
      totalAssets: Number(row.totalAssets || 0),
    };
  }

  async findByName(name: string): Promise<AssetStatus | null> {
    const [rows] = await mysqlPool.execute<RowDataPacket[]>(
      'SELECT id, name, description, createdAt, updatedAt FROM asset_statuses WHERE name = ? LIMIT 1',
      [name],
    );

    if (!rows.length) return null;
    const row = rows[0];
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    };
  }

  async create(data: { name: string; description?: string }): Promise<AssetStatus> {
    const id = uuidv4();
    const now = new Date();
    const description = data.description || null;

    await mysqlPool.execute(
      'INSERT INTO asset_statuses (id, name, description, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)',
      [id, data.name, description, now, now],
    );

    return {
      id,
      name: data.name,
      description,
      createdAt: now,
      updatedAt: now,
    };
  }

  async update(
    id: string,
    data: { name?: string; description?: string },
  ): Promise<AssetStatus> {
    const now = new Date();
    const updates: string[] = ['updatedAt = ?'];
    const params: any[] = [now];

    if (data.name !== undefined) {
      updates.push('name = ?');
      params.push(data.name);
    }
    if (data.description !== undefined) {
      updates.push('description = ?');
      params.push(data.description);
    }

    params.push(id);

    await mysqlPool.execute(
      `UPDATE asset_statuses SET ${updates.join(', ')} WHERE id = ?`,
      params,
    );

    const updated = await this.findById(id);
    if (!updated) {
      throw new Error(`Status with id ${id} not found after update`);
    }

    return {
      id: updated.id,
      name: updated.name,
      description: updated.description,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }

  async delete(id: string): Promise<void> {
    await mysqlPool.execute('DELETE FROM asset_statuses WHERE id = ?', [id]);
  }

  async countAssets(statusId: string): Promise<number> {
    const [rows] = await mysqlPool.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as total FROM assets WHERE statusId = ? AND deletedAt IS NULL',
      [statusId],
    );
    return Number(rows[0]?.total || 0);
  }
}

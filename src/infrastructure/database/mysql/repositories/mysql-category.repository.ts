import { RowDataPacket } from 'mysql2';
import { v4 as uuidv4 } from 'uuid';
import { mysqlPool } from '../mysql.client';
import { AssetCategory } from '../../../../domain/category/category.entity';
import {
  ICategoryRepository,
  CategoryWithCount,
} from '../../../../domain/category/category.repository.interface';

export class MySQLCategoryRepository implements ICategoryRepository {
  async findAll(search?: string): Promise<CategoryWithCount[]> {
    let sql = `
      SELECT c.id, c.name, c.description, c.usefulLife, c.createdAt, c.updatedAt,
             COUNT(a.id) AS totalAssets
      FROM asset_categories c
      LEFT JOIN assets a ON a.categoryId = c.id AND a.deletedAt IS NULL
    `;
    const params: any[] = [];

    if (search) {
      sql += ` WHERE c.name LIKE ? OR c.description LIKE ?`;
      params.push(`%${search}%`, `%${search}%`);
    }

    sql += ` GROUP BY c.id ORDER BY c.name ASC`;

    const [rows] = await mysqlPool.execute<RowDataPacket[]>(sql, params);

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      usefulLife: Number(row.usefulLife),
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
      totalAssets: Number(row.totalAssets || 0),
    }));
  }

  async findById(id: string): Promise<CategoryWithCount | null> {
    const sql = `
      SELECT c.id, c.name, c.description, c.usefulLife, c.createdAt, c.updatedAt,
             COUNT(a.id) AS totalAssets
      FROM asset_categories c
      LEFT JOIN assets a ON a.categoryId = c.id AND a.deletedAt IS NULL
      WHERE c.id = ?
      GROUP BY c.id
      LIMIT 1
    `;

    const [rows] = await mysqlPool.execute<RowDataPacket[]>(sql, [id]);
    if (!rows.length) return null;

    const row = rows[0];
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      usefulLife: Number(row.usefulLife),
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
      totalAssets: Number(row.totalAssets || 0),
    };
  }

  async findByName(name: string): Promise<AssetCategory | null> {
    const [rows] = await mysqlPool.execute<RowDataPacket[]>(
      'SELECT id, name, description, usefulLife, createdAt, updatedAt FROM asset_categories WHERE name = ? LIMIT 1',
      [name],
    );

    if (!rows.length) return null;
    const row = rows[0];
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      usefulLife: Number(row.usefulLife),
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    };
  }

  async create(data: { name: string; description?: string; usefulLife?: number }): Promise<AssetCategory> {
    const id = uuidv4();
    const now = new Date();
    const description = data.description || null;
    const usefulLife = data.usefulLife ?? 5;

    await mysqlPool.execute(
      'INSERT INTO asset_categories (id, name, description, usefulLife, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)',
      [id, data.name, description, usefulLife, now, now],
    );

    return {
      id,
      name: data.name,
      description,
      usefulLife,
      createdAt: now,
      updatedAt: now,
    };
  }

  async update(
    id: string,
    data: { name?: string; description?: string; usefulLife?: number },
  ): Promise<AssetCategory> {
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
    if (data.usefulLife !== undefined) {
      updates.push('usefulLife = ?');
      params.push(data.usefulLife);
    }

    params.push(id);

    await mysqlPool.execute(
      `UPDATE asset_categories SET ${updates.join(', ')} WHERE id = ?`,
      params,
    );

    const updated = await this.findById(id);
    if (!updated) {
      throw new Error(`Category with id ${id} not found after update`);
    }

    return {
      id: updated.id,
      name: updated.name,
      description: updated.description,
      usefulLife: updated.usefulLife,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }

  async delete(id: string): Promise<void> {
    await mysqlPool.execute('DELETE FROM asset_categories WHERE id = ?', [id]);
  }

  async countAssets(categoryId: string): Promise<number> {
    const [rows] = await mysqlPool.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as total FROM assets WHERE categoryId = ? AND deletedAt IS NULL',
      [categoryId],
    );
    return Number(rows[0]?.total || 0);
  }
}

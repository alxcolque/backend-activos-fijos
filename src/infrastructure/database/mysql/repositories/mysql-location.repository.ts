import { RowDataPacket } from 'mysql2';
import { v4 as uuidv4 } from 'uuid';
import { mysqlPool } from '../mysql.client';
import { Location } from '../../../../domain/locations/location.entity';
import {
  ILocationRepository,
  LocationWithCount,
  FindAllLocationsOptions,
  PaginatedLocations,
} from '../../../../domain/locations/location.repository.interface';

export class MySQLLocationRepository implements ILocationRepository {
  async findAll(options: FindAllLocationsOptions): Promise<PaginatedLocations> {
    const page = options.page && options.page > 0 ? options.page : 1;
    const limit = options.limit && options.limit > 0 ? options.limit : 20;
    const offset = (page - 1) * limit;

    const whereConditions = ['l.deletedAt IS NULL'];
    const params: any[] = [];

    if (options.search) {
      whereConditions.push('(l.name LIKE ? OR l.code LIKE ? OR l.description LIKE ?)');
      params.push(`%${options.search}%`, `%${options.search}%`, `%${options.search}%`);
    }

    const whereClause = whereConditions.join(' AND ');
    const sortBy = options.sortBy === 'createdAt' ? 'l.createdAt' : 'l.name';
    const sortOrder = options.sortOrder?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    const countSql = `SELECT COUNT(*) as total FROM locations l WHERE ${whereClause}`;
    const [countRows] = await mysqlPool.query<RowDataPacket[]>(countSql, params);
    const total = Number(countRows[0]?.total || 0);

    const sql = `
      SELECT l.id, l.parent_id AS parentId, l.name, l.description, l.createdAt, l.updatedAt, l.deletedAt,
             (SELECT COUNT(*) FROM assets a WHERE a.locationId = l.id AND a.deletedAt IS NULL) AS totalAssets,
             (SELECT COUNT(*) FROM locations c WHERE c.parent_id = l.id AND c.deletedAt IS NULL) AS totalChildren
      FROM locations l
      WHERE ${whereClause}
      ORDER BY ${sortBy} ${sortOrder}
      LIMIT ${limit} OFFSET ${offset}
    `;

    const [rows] = await mysqlPool.query<RowDataPacket[]>(sql, params);

    const data: LocationWithCount[] = rows.map((row) => ({
      id: row.id,
      parentId: row.parentId,
      name: row.name,
      description: row.description,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
      deletedAt: row.deletedAt ? new Date(row.deletedAt) : null,
      totalAssets: Number(row.totalAssets || 0),
      totalChildren: Number(row.totalChildren || 0),
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

  async findById(id: string): Promise<LocationWithCount | null> {
    const sql = `
      SELECT l.id, l.parent_id AS parentId, l.name, l.description, l.createdAt, l.updatedAt, l.deletedAt,
             (SELECT COUNT(*) FROM assets a WHERE a.locationId = l.id AND a.deletedAt IS NULL) AS totalAssets,
             (SELECT COUNT(*) FROM locations c WHERE c.parent_id = l.id AND c.deletedAt IS NULL) AS totalChildren
      FROM locations l
      WHERE l.id = ? AND l.deletedAt IS NULL
      LIMIT 1
    `;

    const [rows] = await mysqlPool.execute<RowDataPacket[]>(sql, [id]);
    if (!rows.length) return null;

    const row = rows[0];
    return {
      id: row.id,
      parentId: row.parentId,
      name: row.name,
      description: row.description,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
      deletedAt: row.deletedAt ? new Date(row.deletedAt) : null,
      totalAssets: Number(row.totalAssets || 0),
      totalChildren: Number(row.totalChildren || 0),
    };
  }

  async findRawById(id: string): Promise<Location | null> {
    const [rows] = await mysqlPool.execute<RowDataPacket[]>(
      'SELECT id, parent_id AS parentId, name, description, createdAt, updatedAt, deletedAt FROM locations WHERE id = ? AND deletedAt IS NULL LIMIT 1',
      [id],
    );

    if (!rows.length) return null;
    const row = rows[0];
    return {
      id: row.id,
      parentId: row.parentId,
      name: row.name,
      description: row.description,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
      deletedAt: row.deletedAt ? new Date(row.deletedAt) : null,
    };
  }

  async findByNameAndParent(name: string, parentId: string | null): Promise<Location | null> {
    let sql = 'SELECT id, parent_id AS parentId, name, description, createdAt, updatedAt, deletedAt FROM locations WHERE name = ? AND deletedAt IS NULL';
    const params: any[] = [name];

    if (parentId) {
      sql += ' AND parent_id = ?';
      params.push(parentId);
    } else {
      sql += ' AND parent_id IS NULL';
    }

    sql += ' LIMIT 1';

    const [rows] = await mysqlPool.execute<RowDataPacket[]>(sql, params);
    if (!rows.length) return null;

    const row = rows[0];
    return {
      id: row.id,
      parentId: row.parentId,
      name: row.name,
      description: row.description,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
      deletedAt: row.deletedAt ? new Date(row.deletedAt) : null,
    };
  }

  async findAllRaw(): Promise<Location[]> {
    const [rows] = await mysqlPool.execute<RowDataPacket[]>(
      'SELECT id, parent_id AS parentId, name, description, createdAt, updatedAt, deletedAt FROM locations WHERE deletedAt IS NULL ORDER BY name ASC',
    );

    return rows.map((row) => ({
      id: row.id,
      parentId: row.parentId,
      name: row.name,
      description: row.description,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
      deletedAt: row.deletedAt ? new Date(row.deletedAt) : null,
    }));
  }

  async create(data: { parentId?: string | null; name: string; code?: string; description?: string }): Promise<Location> {
    const id = uuidv4();
    const now = new Date();
    const parentId = data.parentId || null;
    const code = data.code || `LOC-${Date.now().toString(36).toUpperCase()}-${uuidv4().substring(0, 4).toUpperCase()}`;
    const description = data.description || null;

    await mysqlPool.execute(
      'INSERT INTO locations (id, parent_id, name, code, description, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, parentId, data.name, code, description, now, now],
    );

    return {
      id,
      parentId,
      name: data.name,
      description,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };
  }

  async update(
    id: string,
    data: { parentId?: string | null; name?: string; description?: string },
  ): Promise<Location> {
    const now = new Date();
    const updates: string[] = ['updatedAt = ?'];
    const params: any[] = [now];

    if (data.parentId !== undefined) {
      updates.push('parent_id = ?');
      params.push(data.parentId || null);
    }
    if (data.name !== undefined) {
      updates.push('name = ?');
      params.push(data.name);
    }
    if (data.description !== undefined) {
      updates.push('description = ?');
      params.push(data.description || null);
    }

    params.push(id);

    await mysqlPool.execute(
      `UPDATE locations SET ${updates.join(', ')} WHERE id = ? AND deletedAt IS NULL`,
      params,
    );

    const updated = await this.findRawById(id);
    if (!updated) {
      throw new Error(`Location with id ${id} not found after update`);
    }

    return updated;
  }

  async delete(id: string): Promise<void> {
    await mysqlPool.execute(
      'UPDATE locations SET deletedAt = ? WHERE id = ?',
      [new Date(), id],
    );
  }

  async existsChildren(id: string): Promise<boolean> {
    const [rows] = await mysqlPool.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as total FROM locations WHERE parent_id = ? AND deletedAt IS NULL',
      [id],
    );
    return Number(rows[0]?.total || 0) > 0;
  }

  async existsAssets(id: string): Promise<boolean> {
    const [rows] = await mysqlPool.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as total FROM assets WHERE locationId = ? AND deletedAt IS NULL',
      [id],
    );
    return Number(rows[0]?.total || 0) > 0;
  }

  async getAllDescendantIds(id: string): Promise<string[]> {
    const allLocations = await this.findAllRaw();
    const descendants: string[] = [];

    const findChildren = (currentId: string) => {
      const children = allLocations.filter((l) => l.parentId === currentId);
      for (const child of children) {
        descendants.push(child.id);
        findChildren(child.id);
      }
    };

    findChildren(id);
    return descendants;
  }
}

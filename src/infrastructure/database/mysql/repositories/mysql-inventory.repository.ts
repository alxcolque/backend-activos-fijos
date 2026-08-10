import { RowDataPacket } from 'mysql2';
import { v4 as uuidv4 } from 'uuid';
import { mysqlPool } from '../mysql.client';
import { Inventory, InventoryItem } from '../../../../domain/inventories/inventory.entity';
import { InventoryStatus } from '../../../../domain/enums/inventory-status.enum';
import {
  IInventoryRepository,
  InventoryDetail,
  InventoryItemDetail,
  FindAllInventoriesOptions,
  PaginatedInventories,
  CreateInventoryDto,
  RegisterInventoryItemDto,
} from '../../../../domain/inventories/inventory.repository.interface';

export class MySQLInventoryRepository implements IInventoryRepository {
  async findAll(options: FindAllInventoriesOptions): Promise<PaginatedInventories> {
    const page = options.page && options.page > 0 ? options.page : 1;
    const limit = options.limit && options.limit > 0 ? options.limit : 20;
    const offset = (page - 1) * limit;

    const whereConditions: string[] = [];
    const params: any[] = [];

    if (options.locationId) {
      whereConditions.push('inv.locationId = ?');
      params.push(options.locationId);
    }
    if (options.search) {
      whereConditions.push('(inv.name LIKE ? OR inv.observations LIKE ? OR loc.name LIKE ?)');
      const s = `%${options.search}%`;
      params.push(s, s, s);
    }

    const whereClause = whereConditions.length ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const countSql = `
      SELECT COUNT(*) as total
      FROM inventories inv
      LEFT JOIN locations loc ON loc.id = inv.locationId
      ${whereClause}
    `;
    const [countRows] = await mysqlPool.execute<RowDataPacket[]>(countSql, params);
    const total = Number(countRows[0]?.total || 0);

    const sql = `
      SELECT inv.*, loc.name AS locationName,
             (SELECT COUNT(*) FROM inventory_items ii WHERE ii.inventoryId = inv.id) AS totalItems
      FROM inventories inv
      LEFT JOIN locations loc ON loc.id = inv.locationId
      ${whereClause}
      ORDER BY inv.inventoryDate DESC
      LIMIT ? OFFSET ?
    `;

    const [rows] = await mysqlPool.execute<RowDataPacket[]>(sql, [...params, limit, offset]);

    const formattedData: InventoryDetail[] = rows.map((row) => ({
      id: row.id,
      name: row.name,
      inventoryDate: new Date(row.inventoryDate),
      locationId: row.locationId,
      observations: row.observations || null,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
      location: { id: row.locationId, name: row.locationName },
      stats: {
        totalItems: Number(row.totalItems || 0),
        found: 0,
        notFound: 0,
        damaged: 0,
      },
    }));

    return {
      data: formattedData,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async findById(id: string): Promise<InventoryDetail | null> {
    const sql = `
      SELECT inv.*, loc.name AS locationName
      FROM inventories inv
      LEFT JOIN locations loc ON loc.id = inv.locationId
      WHERE inv.id = ?
      LIMIT 1
    `;

    const [rows] = await mysqlPool.execute<RowDataPacket[]>(sql, [id]);
    if (!rows.length) return null;

    const row = rows[0];

    const [items] = await mysqlPool.execute<RowDataPacket[]>(
      'SELECT status FROM inventory_items WHERE inventoryId = ?',
      [id],
    );

    const found = items.filter((i) => i.status === 'FOUND').length;
    const notFound = items.filter((i) => i.status === 'NOT_FOUND').length;
    const damaged = items.filter((i) => i.status === 'DAMAGED').length;

    return {
      id: row.id,
      name: row.name,
      inventoryDate: new Date(row.inventoryDate),
      locationId: row.locationId,
      observations: row.observations || null,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
      location: { id: row.locationId, name: row.locationName },
      stats: {
        totalItems: items.length,
        found,
        notFound,
        damaged,
      },
    };
  }

  async findItemByInventoryAndAsset(inventoryId: string, assetId: string): Promise<InventoryItem | null> {
    const [rows] = await mysqlPool.execute<RowDataPacket[]>(
      'SELECT * FROM inventory_items WHERE inventoryId = ? AND assetId = ? LIMIT 1',
      [inventoryId, assetId],
    );
    if (!rows.length) return null;
    const row = rows[0];
    return {
      id: row.id,
      inventoryId: row.inventoryId,
      assetId: row.assetId,
      status: row.status as InventoryStatus,
      observations: row.observations || null,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    };
  }

  async findItemsByInventoryId(inventoryId: string): Promise<InventoryItemDetail[]> {
    const sql = `
      SELECT ii.*,
             a.code AS assetCode, a.name AS assetName,
             c.id AS categoryId, c.name AS categoryName,
             st.id AS statusId, st.name AS statusName
      FROM inventory_items ii
      LEFT JOIN assets a ON a.id = ii.assetId
      LEFT JOIN asset_categories c ON c.id = a.categoryId
      LEFT JOIN asset_statuses st ON st.id = a.statusId
      WHERE ii.inventoryId = ?
      ORDER BY ii.createdAt DESC
    `;

    const [rows] = await mysqlPool.execute<RowDataPacket[]>(sql, [inventoryId]);

    return rows.map((row) => ({
      id: row.id,
      inventoryId: row.inventoryId,
      assetId: row.assetId,
      status: row.status as InventoryStatus,
      observations: row.observations || null,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
      asset: {
        id: row.assetId,
        code: row.assetCode,
        name: row.assetName,
        category: row.categoryId ? { id: row.categoryId, name: row.categoryName } : undefined,
        status: row.statusId ? { id: row.statusId, name: row.statusName } : undefined,
      },
    }));
  }

  async create(data: CreateInventoryDto): Promise<Inventory> {
    const id = uuidv4();
    const now = new Date();

    await mysqlPool.execute(
      'INSERT INTO inventories (id, name, inventoryDate, locationId, observations, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, data.name, data.inventoryDate, data.locationId, data.observations || null, now, now],
    );

    return {
      id,
      name: data.name,
      inventoryDate: data.inventoryDate,
      locationId: data.locationId,
      observations: data.observations || null,
      createdAt: now,
      updatedAt: now,
    };
  }

  async registerItem(data: RegisterInventoryItemDto): Promise<InventoryItem> {
    const existing = await this.findItemByInventoryAndAsset(data.inventoryId, data.assetId);
    const now = new Date();
    const status = data.status || InventoryStatus.FOUND;

    if (existing) {
      await mysqlPool.execute(
        'UPDATE inventory_items SET status = ?, observations = ?, updatedAt = ? WHERE id = ?',
        [status, data.observations || null, now, existing.id],
      );

      return {
        ...existing,
        status,
        observations: data.observations || null,
        updatedAt: now,
      };
    }

    const id = uuidv4();
    await mysqlPool.execute(
      'INSERT INTO inventory_items (id, inventoryId, assetId, status, observations, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, data.inventoryId, data.assetId, status, data.observations || null, now, now],
    );

    return {
      id,
      inventoryId: data.inventoryId,
      assetId: data.assetId,
      status,
      observations: data.observations || null,
      createdAt: now,
      updatedAt: now,
    };
  }

  async delete(id: string): Promise<void> {
    await mysqlPool.execute('DELETE FROM inventories WHERE id = ?', [id]);
  }

  async existsLocation(locationId: string): Promise<boolean> {
    const [rows] = await mysqlPool.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as total FROM locations WHERE id = ? AND deletedAt IS NULL',
      [locationId],
    );
    return Number(rows[0]?.total || 0) > 0;
  }

  async existsAsset(assetId: string): Promise<boolean> {
    const [rows] = await mysqlPool.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as total FROM assets WHERE id = ? AND deletedAt IS NULL',
      [assetId],
    );
    return Number(rows[0]?.total || 0) > 0;
  }
}

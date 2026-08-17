import { RowDataPacket } from 'mysql2';
import { v4 as uuidv4 } from 'uuid';
import { mysqlPool } from '../mysql.client';
import { Asset } from '../../../../domain/assets/asset.entity';
import { IImportRepository } from '../../../../domain/import/import.repository.interface';

export class MySQLImportRepository implements IImportRepository {
  async findDefaultCategory(): Promise<string> {
    const [rows] = await mysqlPool.execute<RowDataPacket[]>('SELECT id FROM asset_categories LIMIT 1');
    if (rows.length) return rows[0].id;

    const id = uuidv4();
    const now = new Date();
    await mysqlPool.execute(
      'INSERT INTO asset_categories (id, name, description, usefulLife, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)',
      [id, 'GENERAL', 'Categoría General', 5, now, now],
    );
    return id;
  }

  async findCategoryByName(name: string): Promise<string | null> {
    const [rows] = await mysqlPool.execute<RowDataPacket[]>(
      'SELECT id FROM asset_categories WHERE name = ? LIMIT 1',
      [name],
    );
    return rows.length ? rows[0].id : null;
  }

  async createCategory(name: string): Promise<string> {
    const id = uuidv4();
    const now = new Date();
    await mysqlPool.execute(
      'INSERT INTO asset_categories (id, name, description, usefulLife, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)',
      [id, name, 'Categoría importada', 5, now, now],
    );
    return id;
  }

  async findDefaultStatus(): Promise<string> {
    const [rows] = await mysqlPool.execute<RowDataPacket[]>('SELECT id FROM asset_statuses LIMIT 1');
    if (rows.length) return rows[0].id;

    const id = uuidv4();
    const now = new Date();
    await mysqlPool.execute(
      'INSERT INTO asset_statuses (id, name, description, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)',
      [id, 'ACTIVO', 'Estado Activo', now, now],
    );
    return id;
  }

  async findStatusByName(name: string): Promise<string | null> {
    const [rows] = await mysqlPool.execute<RowDataPacket[]>(
      'SELECT id FROM asset_statuses WHERE name = ? LIMIT 1',
      [name],
    );
    return rows.length ? rows[0].id : null;
  }

  async findDefaultLocation(): Promise<string> {
    const [rows] = await mysqlPool.execute<RowDataPacket[]>(
      'SELECT id FROM locations WHERE name = ? AND deletedAt IS NULL LIMIT 1',
      ['COMIBOL'],
    );
    if (rows.length) return rows[0].id;

    const [anyRows] = await mysqlPool.execute<RowDataPacket[]>(
      'SELECT id FROM locations WHERE deletedAt IS NULL LIMIT 1',
    );
    if (anyRows.length) return anyRows[0].id;

    const id = uuidv4();
    const now = new Date();
    await mysqlPool.execute(
      'INSERT INTO locations (id, name, description, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)',
      [id, 'COMIBOL', 'Oficina Central', now, now],
    );
    return id;
  }

  async findLocationByName(name: string): Promise<string | null> {
    const [rows] = await mysqlPool.execute<RowDataPacket[]>(
      'SELECT id FROM locations WHERE name = ? AND deletedAt IS NULL LIMIT 1',
      [name],
    );
    return rows.length ? rows[0].id : null;
  }

  async existsCode(code: string): Promise<boolean> {
    const [rows] = await mysqlPool.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as total FROM assets WHERE code = ?',
      [code],
    );
    return Number(rows[0]?.total || 0) > 0;
  }

  async existsSerial(serial: string): Promise<boolean> {
    const [rows] = await mysqlPool.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as total FROM assets WHERE serialNumber = ?',
      [serial],
    );
    return Number(rows[0]?.total || 0) > 0;
  }

  async bulkCreateAssets(assetsData: any[]): Promise<Asset[]> {
    const conn = await mysqlPool.getConnection();
    const createdAssets: Asset[] = [];

    try {
      await conn.beginTransaction();

      for (const data of assetsData) {
        const id = uuidv4();
        const now = new Date();
        const qrCode = data.qrCode || data.code;
        const unit = data.unit || 'PZA';
        const quantity = data.quantity ?? 1;
        const currentValue = data.currentValue !== undefined ? data.currentValue : (data.purchaseValue !== undefined ? data.purchaseValue : null);

        await conn.execute(
          `INSERT INTO assets (
            id, code, qrCode, name, description, categoryId, statusId, locationId,
            brand, model, serialNumber, unit, quantity, purchaseDate, purchaseYear,
            purchaseValue, residualValue, currentValue, observations, photo, createdAt, updatedAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            id,
            data.code,
            qrCode,
            data.name,
            data.description || null,
            data.categoryId,
            data.statusId,
            data.locationId,
            data.brand || null,
            data.model || null,
            data.serialNumber || null,
            unit,
            quantity,
            data.purchaseDate || null,
            data.purchaseYear || null,
            data.purchaseValue !== undefined ? data.purchaseValue : null,
            data.residualValue !== undefined ? data.residualValue : null,
            currentValue,
            data.observations || null,
            data.photo || null,
            now,
            now,
          ],
        );

        createdAssets.push({
          id,
          code: data.code,
          qrCode,
          name: data.name,
          description: data.description || null,
          categoryId: data.categoryId,
          statusId: data.statusId,
          locationId: data.locationId,
          brand: data.brand || null,
          model: data.model || null,
          serialNumber: data.serialNumber || null,
          unit,
          quantity,
          quantityOut: 0,
          purchaseDate: data.purchaseDate || null,
          purchaseYear: data.purchaseYear || null,
          purchaseValue: data.purchaseValue !== undefined ? data.purchaseValue : null,
          residualValue: data.residualValue !== undefined ? data.residualValue : null,
          currentValue,
          observations: data.observations || null,
          photo: data.photo || null,
          createdAt: now,
          updatedAt: now,
          deletedAt: null,
        });
      }

      await conn.commit();
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }

    return createdAssets;
  }
}

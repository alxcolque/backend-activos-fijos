import { RowDataPacket } from 'mysql2';
import { v4 as uuidv4 } from 'uuid';
import { mysqlPool } from '../mysql.client';
import { Asset } from '../../../../domain/assets/asset.entity';
import {
  IAssetRepository,
  AssetListItem,
  AssetDetail,
  FindAllAssetsOptions,
  PaginatedAssets,
  CreateAssetDto,
  UpdateAssetDto,
} from '../../../../domain/assets/asset.repository.interface';
import {
  calculateFinancials,
} from '../../../utils/asset-financials';

export class MySQLAssetRepository implements IAssetRepository {
  private mapRowToAsset(row: any): Asset {
    return {
      id: row.id,
      code: row.code,
      qrCode: row.qrCode,
      name: row.name,
      description: row.description,
      categoryId: row.categoryId,
      statusId: row.statusId,
      locationId: row.locationId,
      brand: row.brand,
      model: row.model,
      serialNumber: row.serialNumber,
      unit: row.unit || 'PZA',
      quantity: Number(row.quantity ?? 1),
      quantityOut: Number(row.quantity_out ?? row.quantityOut ?? 0),
      purchaseDate: row.purchaseDate ? new Date(row.purchaseDate) : null,
      purchaseYear: row.purchaseYear ? Number(row.purchaseYear) : null,
      purchaseValue: row.purchaseValue !== null && row.purchaseValue !== undefined ? Number(row.purchaseValue) : null,
      residualValue: row.residualValue !== null && row.residualValue !== undefined ? Number(row.residualValue) : null,
      currentValue: row.currentValue !== null && row.currentValue !== undefined ? Number(row.currentValue) : null,
      observations: row.observations,
      photo: row.photo,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
      deletedAt: row.deletedAt ? new Date(row.deletedAt) : null,
    };
  }

  async findAll(options: FindAllAssetsOptions): Promise<PaginatedAssets> {
    const page = options.page && options.page > 0 ? options.page : 1;
    const limit = options.limit && options.limit > 0 ? options.limit : 20;
    const offset = (page - 1) * limit;

    const whereConditions = ['a.deletedAt IS NULL'];
    const params: any[] = [];

    if (options.category) {
      whereConditions.push('a.categoryId = ?');
      params.push(options.category);
    }
    if (options.status) {
      whereConditions.push('a.statusId = ?');
      params.push(options.status);
    }
    if (options.location) {
      whereConditions.push('a.locationId = ?');
      params.push(options.location);
    }
    if (options.search) {
      whereConditions.push('(a.code LIKE ? OR a.name LIKE ? OR a.description LIKE ? OR a.brand LIKE ? OR a.model LIKE ? OR a.serialNumber LIKE ?)');
      const s = `%${options.search}%`;
      params.push(s, s, s, s, s, s);
    }

    const whereClause = whereConditions.join(' AND ');
    const sortBy = options.sortBy === 'code' ? 'a.code'
      : options.sortBy === 'purchaseDate' ? 'a.purchaseDate'
      : options.sortBy === 'purchaseValue' ? 'a.purchaseValue'
      : options.sortBy === 'createdAt' ? 'a.createdAt'
      : 'a.name';
    const sortOrder = options.sortOrder?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    const countSql = `SELECT COUNT(*) as total FROM assets a WHERE ${whereClause}`;
    const [countRows] = await mysqlPool.execute<RowDataPacket[]>(countSql, params);
    const total = Number(countRows[0]?.total || 0);

    const sql = `
      SELECT a.*,
             c.name AS categoryName, c.usefulLife AS categoryUsefulLife,
             s.name AS statusName,
             l.name AS locationName
      FROM assets a
      LEFT JOIN asset_categories c ON c.id = a.categoryId
      LEFT JOIN asset_statuses s ON s.id = a.statusId
      LEFT JOIN locations l ON l.id = a.locationId
      WHERE ${whereClause}
      ORDER BY ${sortBy} ${sortOrder}
      LIMIT ? OFFSET ?
    `;

    const [rows] = await mysqlPool.execute<RowDataPacket[]>(sql, [...params, limit, offset]);

    const formattedData: AssetListItem[] = rows.map((row) => {
      const pVal = row.purchaseValue ? Number(row.purchaseValue) : 0;
      const uLife = row.categoryUsefulLife ? Number(row.categoryUsefulLife) : 5;
      const fin = calculateFinancials(pVal, row.purchaseDate, uLife);

      return {
        id: row.id,
        code: row.code,
        qrCode: row.qrCode,
        name: row.name,
        quantity: Number(row.quantity ?? 1),
        quantityOut: Number(row.quantity_out ?? row.quantityOut ?? 0),
        unit: row.unit || 'PZA',
        category: { id: row.categoryId, name: row.categoryName, usefulLife: uLife },
        status: { id: row.statusId, name: row.statusName },
        location: { id: row.locationId, name: row.locationName },
        brand: row.brand,
        model: row.model,
        serialNumber: row.serialNumber,
        purchaseDate: row.purchaseDate ? new Date(row.purchaseDate) : null,
        purchaseValue: pVal,
        currentValue: row.currentValue ? Number(row.currentValue) : null,
        photo: row.photo,
        dep: fin.dep,
        depac: fin.depac,
        balance: fin.balance,
        createdAt: new Date(row.createdAt),
      };
    });

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

  async findById(id: string): Promise<AssetDetail | null> {
    const sql = `
      SELECT a.*,
             c.name AS categoryName, c.usefulLife AS categoryUsefulLife,
             s.name AS statusName,
             l.name AS locationName
      FROM assets a
      LEFT JOIN asset_categories c ON c.id = a.categoryId
      LEFT JOIN asset_statuses s ON s.id = a.statusId
      LEFT JOIN locations l ON l.id = a.locationId
      WHERE a.id = ? AND a.deletedAt IS NULL
      LIMIT 1
    `;

    const [rows] = await mysqlPool.execute<RowDataPacket[]>(sql, [id]);
    if (!rows.length) return null;

    const row = rows[0];
    const pVal = row.purchaseValue ? Number(row.purchaseValue) : 0;
    const uLife = row.categoryUsefulLife ? Number(row.categoryUsefulLife) : 5;
    const fin = calculateFinancials(pVal, row.purchaseDate, uLife);

    const asset = this.mapRowToAsset(row);

    return {
      ...asset,
      category: { id: row.categoryId, name: row.categoryName, usefulLife: uLife },
      status: { id: row.statusId, name: row.statusName },
      location: { id: row.locationId, name: row.locationName },
      purchaseValue: pVal as any,
      currentValue: row.currentValue !== null ? Number(row.currentValue) : null,
      residualValue: row.residualValue !== null ? Number(row.residualValue) : null,
      dep: fin.dep,
      depac: fin.depac,
      balance: fin.balance,
    } as AssetDetail;
  }

  async findRawById(id: string): Promise<Asset | null> {
    const [rows] = await mysqlPool.execute<RowDataPacket[]>(
      'SELECT * FROM assets WHERE id = ? AND deletedAt IS NULL LIMIT 1',
      [id],
    );

    if (!rows.length) return null;
    return this.mapRowToAsset(rows[0]);
  }

  async findByCode(code: string): Promise<AssetDetail | null> {
    const sql = `
      SELECT a.*,
             c.name AS categoryName, c.usefulLife AS categoryUsefulLife,
             s.name AS statusName,
             l.name AS locationName
      FROM assets a
      LEFT JOIN asset_categories c ON c.id = a.categoryId
      LEFT JOIN asset_statuses s ON s.id = a.statusId
      LEFT JOIN locations l ON l.id = a.locationId
      WHERE a.code = ? AND a.deletedAt IS NULL
      LIMIT 1
    `;

    const [rows] = await mysqlPool.execute<RowDataPacket[]>(sql, [code]);
    if (!rows.length) return null;

    const row = rows[0];
    const pVal = row.purchaseValue ? Number(row.purchaseValue) : 0;
    const uLife = row.categoryUsefulLife ? Number(row.categoryUsefulLife) : 5;
    const fin = calculateFinancials(pVal, row.purchaseDate, uLife);

    const asset = this.mapRowToAsset(row);

    return {
      ...asset,
      category: { id: row.categoryId, name: row.categoryName, usefulLife: uLife },
      status: { id: row.statusId, name: row.statusName },
      location: { id: row.locationId, name: row.locationName },
      purchaseValue: pVal as any,
      currentValue: row.currentValue !== null ? Number(row.currentValue) : null,
      residualValue: row.residualValue !== null ? Number(row.residualValue) : null,
      dep: fin.dep,
      depac: fin.depac,
      balance: fin.balance,
    } as AssetDetail;
  }

  async findByQr(qrCode: string): Promise<AssetDetail | null> {
    const sql = `
      SELECT a.*,
             c.name AS categoryName, c.usefulLife AS categoryUsefulLife,
             s.name AS statusName,
             l.name AS locationName
      FROM assets a
      LEFT JOIN asset_categories c ON c.id = a.categoryId
      LEFT JOIN asset_statuses s ON s.id = a.statusId
      LEFT JOIN locations l ON l.id = a.locationId
      WHERE a.qrCode = ? AND a.deletedAt IS NULL
      LIMIT 1
    `;

    const [rows] = await mysqlPool.execute<RowDataPacket[]>(sql, [qrCode]);
    if (!rows.length) return null;

    const row = rows[0];
    const pVal = row.purchaseValue ? Number(row.purchaseValue) : 0;
    const uLife = row.categoryUsefulLife ? Number(row.categoryUsefulLife) : 5;
    const fin = calculateFinancials(pVal, row.purchaseDate, uLife);

    const asset = this.mapRowToAsset(row);

    return {
      ...asset,
      category: { id: row.categoryId, name: row.categoryName, usefulLife: uLife },
      status: { id: row.statusId, name: row.statusName },
      location: { id: row.locationId, name: row.locationName },
      purchaseValue: pVal as any,
      currentValue: row.currentValue !== null ? Number(row.currentValue) : null,
      residualValue: row.residualValue !== null ? Number(row.residualValue) : null,
      dep: fin.dep,
      depac: fin.depac,
      balance: fin.balance,
    } as AssetDetail;
  }

  async findBySerial(serialNumber: string): Promise<Asset | null> {
    const [rows] = await mysqlPool.execute<RowDataPacket[]>(
      'SELECT * FROM assets WHERE serialNumber = ? AND deletedAt IS NULL LIMIT 1',
      [serialNumber],
    );

    if (!rows.length) return null;
    return this.mapRowToAsset(rows[0]);
  }

  async create(data: CreateAssetDto): Promise<Asset> {
    const id = uuidv4();
    const now = new Date();
    const qrCode = data.qrCode || data.code;
    const unit = data.unit || 'PZA';
    const quantity = data.quantity ?? 1;

    const currentValue = data.currentValue !== undefined
      ? data.currentValue
      : data.purchaseValue !== undefined
        ? data.purchaseValue
        : null;

    await mysqlPool.execute(
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

    const created = await this.findRawById(id);
    if (!created) throw new Error(`Asset with id ${id} not found after creation`);
    return created;
  }

  async update(id: string, data: UpdateAssetDto): Promise<Asset> {
    const now = new Date();
    const updates: string[] = ['updatedAt = ?'];
    const params: any[] = [now];

    if (data.code !== undefined) { updates.push('code = ?', 'qrCode = ?'); params.push(data.code, data.code); }
    if (data.name !== undefined) { updates.push('name = ?'); params.push(data.name); }
    if (data.description !== undefined) { updates.push('description = ?'); params.push(data.description || null); }
    if (data.categoryId !== undefined) { updates.push('categoryId = ?'); params.push(data.categoryId); }
    if (data.statusId !== undefined) { updates.push('statusId = ?'); params.push(data.statusId); }
    if (data.locationId !== undefined) { updates.push('locationId = ?'); params.push(data.locationId); }
    if (data.brand !== undefined) { updates.push('brand = ?'); params.push(data.brand || null); }
    if (data.model !== undefined) { updates.push('model = ?'); params.push(data.model || null); }
    if (data.serialNumber !== undefined) { updates.push('serialNumber = ?'); params.push(data.serialNumber || null); }
    if (data.unit !== undefined) { updates.push('unit = ?'); params.push(data.unit || 'PZA'); }
    if (data.quantity !== undefined) { updates.push('quantity = ?'); params.push(data.quantity); }
    if (data.purchaseDate !== undefined) { updates.push('purchaseDate = ?'); params.push(data.purchaseDate || null); }
    if (data.purchaseYear !== undefined) { updates.push('purchaseYear = ?'); params.push(data.purchaseYear || null); }
    if (data.purchaseValue !== undefined) { updates.push('purchaseValue = ?'); params.push(data.purchaseValue || null); }
    if (data.residualValue !== undefined) { updates.push('residualValue = ?'); params.push(data.residualValue || null); }
    if (data.currentValue !== undefined) { updates.push('currentValue = ?'); params.push(data.currentValue || null); }
    if (data.observations !== undefined) { updates.push('observations = ?'); params.push(data.observations || null); }
    if (data.photo !== undefined) { updates.push('photo = ?'); params.push(data.photo || null); }

    params.push(id);

    await mysqlPool.execute(
      `UPDATE assets SET ${updates.join(', ')} WHERE id = ? AND deletedAt IS NULL`,
      params,
    );

    const updated = await this.findRawById(id);
    if (!updated) throw new Error(`Asset with id ${id} not found after update`);
    return updated;
  }

  async delete(id: string): Promise<void> {
    await mysqlPool.execute('UPDATE assets SET deletedAt = ? WHERE id = ?', [new Date(), id]);
  }

  async existsCategory(categoryId: string): Promise<boolean> {
    const [rows] = await mysqlPool.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as total FROM asset_categories WHERE id = ?',
      [categoryId],
    );
    return Number(rows[0]?.total || 0) > 0;
  }

  async existsStatus(statusId: string): Promise<boolean> {
    const [rows] = await mysqlPool.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as total FROM asset_statuses WHERE id = ?',
      [statusId],
    );
    return Number(rows[0]?.total || 0) > 0;
  }

  async existsLocation(locationId: string): Promise<boolean> {
    const [rows] = await mysqlPool.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as total FROM locations WHERE id = ? AND deletedAt IS NULL',
      [locationId],
    );
    return Number(rows[0]?.total || 0) > 0;
  }

  async hasRelatedData(assetId: string): Promise<boolean> {
    const [ap] = await mysqlPool.execute<RowDataPacket[]>('SELECT COUNT(*) as total FROM asset_projects WHERE assetId = ?', [assetId]);
    const [ass] = await mysqlPool.execute<RowDataPacket[]>('SELECT COUNT(*) as total FROM asset_assignments WHERE assetId = ?', [assetId]);
    const [doc] = await mysqlPool.execute<RowDataPacket[]>('SELECT COUNT(*) as total FROM asset_documents WHERE assetId = ?', [assetId]);
    const [maint] = await mysqlPool.execute<RowDataPacket[]>('SELECT COUNT(*) as total FROM asset_maintenances WHERE assetId = ?', [assetId]);
    const [item] = await mysqlPool.execute<RowDataPacket[]>('SELECT COUNT(*) as total FROM inventory_items WHERE assetId = ?', [assetId]);

    return (
      Number(ap[0]?.total || 0) > 0 ||
      Number(ass[0]?.total || 0) > 0 ||
      Number(doc[0]?.total || 0) > 0 ||
      Number(maint[0]?.total || 0) > 0 ||
      Number(item[0]?.total || 0) > 0
    );
  }
}

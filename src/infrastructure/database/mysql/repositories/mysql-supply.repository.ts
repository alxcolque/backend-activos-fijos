import { v4 as uuidv4 } from 'uuid';
import { RowDataPacket } from 'mysql2';
import { mysqlPool } from '../mysql.client';
import {
  ISupplyRepository,
  FindAllSuppliesOptions,
  PaginatedSupplies,
  CreateSupplyDto,
  UpdateSupplyDto,
} from '../../../../domain/supplies/supply.repository.interface';
import { SupplyEntity } from '../../../../domain/supplies/supply.entity';

export class MySQLSupplyRepository implements ISupplyRepository {
  async findAll(options: FindAllSuppliesOptions): Promise<PaginatedSupplies> {
    const page = Math.max(1, Number(options.page || 1));
    const limit = Math.max(1, Math.min(500, Number(options.limit || 10)));
    const offset = (page - 1) * limit;

    const whereConditions: string[] = [];
    const params: any[] = [];

    if (options.search) {
      whereConditions.push('(s.name LIKE ? OR s.observations LIKE ? OR s.unit LIKE ?)');
      params.push(`%${options.search}%`, `%${options.search}%`, `%${options.search}%`);
    }

    if (options.categoryId) {
      whereConditions.push('s.category_id = ?');
      params.push(options.categoryId);
    }

    if (options.locationId) {
      whereConditions.push('s.location_id = ?');
      params.push(options.locationId);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const [countRows] = await mysqlPool.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM supplies s ${whereClause}`,
      params,
    );
    const total = Number(countRows[0]?.total || 0);

    const sql = `
      SELECT s.id, s.name, s.category_id, s.location_id, s.unit, s.input_quantity, s.output_quantity,
             s.entry_date, s.observations, s.created_at, s.updated_at,
             c.name AS category_name, l.name AS location_name
      FROM supplies s
      LEFT JOIN asset_categories c ON c.id = s.category_id
      LEFT JOIN locations l ON l.id = s.location_id
      ${whereClause}
      ORDER BY s.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const [rows] = await mysqlPool.query<RowDataPacket[]>(sql, params);

    const data: SupplyEntity[] = rows.map((r: any) => ({
      id: r.id,
      name: r.name,
      categoryId: r.category_id || null,
      locationId: r.location_id || null,
      unit: r.unit || 'PZA',
      inputQuantity: Number(r.input_quantity || 0),
      outputQuantity: Number(r.output_quantity || 0),
      entryDate: r.entry_date ? new Date(r.entry_date) : null,
      observations: r.observations || null,
      createdAt: new Date(r.created_at),
      updatedAt: new Date(r.updated_at),
      category: r.category_id ? { id: r.category_id, name: r.category_name } : null,
      location: r.location_id ? { id: r.location_id, name: r.location_name } : null,
    }));

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }

  async findById(id: string): Promise<SupplyEntity | null> {
    const sql = `
      SELECT s.id, s.name, s.category_id, s.location_id, s.unit, s.input_quantity, s.output_quantity,
             s.entry_date, s.observations, s.created_at, s.updated_at,
             c.name AS category_name, l.name AS location_name
      FROM supplies s
      LEFT JOIN asset_categories c ON c.id = s.category_id
      LEFT JOIN locations l ON l.id = s.location_id
      WHERE s.id = ?
      LIMIT 1
    `;
    const [rows] = await mysqlPool.execute<RowDataPacket[]>(sql, [id]);
    if (!rows.length) return null;
    const r = rows[0];
    return {
      id: r.id,
      name: r.name,
      categoryId: r.category_id || null,
      locationId: r.location_id || null,
      unit: r.unit || 'PZA',
      inputQuantity: Number(r.input_quantity || 0),
      outputQuantity: Number(r.output_quantity || 0),
      entryDate: r.entry_date ? new Date(r.entry_date) : null,
      observations: r.observations || null,
      createdAt: new Date(r.created_at),
      updatedAt: new Date(r.updated_at),
      category: r.category_id ? { id: r.category_id, name: r.category_name } : null,
      location: r.location_id ? { id: r.location_id, name: r.location_name } : null,
    };
  }

  async create(data: CreateSupplyDto): Promise<SupplyEntity> {
    const id = uuidv4();
    const now = new Date();
    const name = data.name.trim();
    const categoryId = data.categoryId || null;
    const locationId = data.locationId || null;
    const unit = data.unit ? data.unit.trim() : 'PZA';
    const inputQuantity = Number(data.inputQuantity || 0);
    const outputQuantity = Number(data.outputQuantity || 0);
    const entryDate = data.entryDate ? new Date(data.entryDate) : null;
    const observations = data.observations || null;

    await mysqlPool.execute(
      'INSERT INTO supplies (id, name, category_id, location_id, unit, input_quantity, output_quantity, entry_date, observations, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, name, categoryId, locationId, unit, inputQuantity, outputQuantity, entryDate, observations, now, now],
    );

    const created = await this.findById(id);
    if (!created) throw new Error('Error al recuperar material creado.');
    return created;
  }

  async update(id: string, data: UpdateSupplyDto): Promise<SupplyEntity> {
    const updates: string[] = [];
    const params: any[] = [];

    if (data.name !== undefined) {
      updates.push('name = ?');
      params.push(data.name.trim());
    }
    if (data.categoryId !== undefined) {
      updates.push('category_id = ?');
      params.push(data.categoryId || null);
    }
    if (data.locationId !== undefined) {
      updates.push('location_id = ?');
      params.push(data.locationId || null);
    }
    if (data.unit !== undefined) {
      updates.push('unit = ?');
      params.push(data.unit.trim());
    }
    if (data.inputQuantity !== undefined) {
      updates.push('input_quantity = ?');
      params.push(Number(data.inputQuantity));
    }
    if (data.outputQuantity !== undefined) {
      updates.push('output_quantity = ?');
      params.push(Number(data.outputQuantity));
    }
    if (data.entryDate !== undefined) {
      updates.push('entry_date = ?');
      params.push(data.entryDate ? new Date(data.entryDate) : null);
    }
    if (data.observations !== undefined) {
      updates.push('observations = ?');
      params.push(data.observations || null);
    }

    updates.push('updated_at = ?');
    params.push(new Date());
    params.push(id);

    await mysqlPool.execute(`UPDATE supplies SET ${updates.join(', ')} WHERE id = ?`, params);

    const item = await this.findById(id);
    if (!item) throw new Error('Material no encontrado tras actualizar.');
    return item;
  }

  async delete(id: string): Promise<boolean> {
    await mysqlPool.execute('DELETE FROM supplies WHERE id = ?', [id]);
    return true;
  }
}

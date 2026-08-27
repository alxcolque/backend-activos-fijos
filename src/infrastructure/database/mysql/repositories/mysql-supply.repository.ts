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
    const limit = Math.max(1, Math.min(100, Number(options.limit || 10)));
    const offset = (page - 1) * limit;

    const whereConditions: string[] = [];
    const params: any[] = [];

    if (options.search) {
      whereConditions.push('(name LIKE ? OR observations LIKE ? OR unit LIKE ?)');
      params.push(`%${options.search}%`, `%${options.search}%`, `%${options.search}%`);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const [countRows] = await mysqlPool.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM supplies ${whereClause}`,
      params,
    );
    const total = Number(countRows[0]?.total || 0);

    const [rows] = await mysqlPool.execute<RowDataPacket[]>(
      `SELECT id, name, unit, input_quantity, output_quantity, entry_date, observations, created_at, updated_at FROM supplies ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset],
    );

    const data: SupplyEntity[] = rows.map((r: any) => ({
      id: r.id,
      name: r.name,
      unit: r.unit || 'PZA',
      inputQuantity: Number(r.input_quantity || 0),
      outputQuantity: Number(r.output_quantity || 0),
      entryDate: r.entry_date ? new Date(r.entry_date) : null,
      observations: r.observations || null,
      createdAt: new Date(r.created_at),
      updatedAt: new Date(r.updated_at),
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
    const [rows] = await mysqlPool.execute<RowDataPacket[]>(
      'SELECT id, name, unit, input_quantity, output_quantity, entry_date, observations, created_at, updated_at FROM supplies WHERE id = ? LIMIT 1',
      [id],
    );
    if (!rows.length) return null;
    const r = rows[0];
    return {
      id: r.id,
      name: r.name,
      unit: r.unit || 'PZA',
      inputQuantity: Number(r.input_quantity || 0),
      outputQuantity: Number(r.output_quantity || 0),
      entryDate: r.entry_date ? new Date(r.entry_date) : null,
      observations: r.observations || null,
      createdAt: new Date(r.created_at),
      updatedAt: new Date(r.updated_at),
    };
  }

  async create(data: CreateSupplyDto): Promise<SupplyEntity> {
    const id = uuidv4();
    const now = new Date();
    const name = data.name.trim();
    const unit = data.unit ? data.unit.trim() : 'PZA';
    const inputQuantity = Number(data.inputQuantity || 0);
    const outputQuantity = Number(data.outputQuantity || 0);
    const entryDate = data.entryDate ? new Date(data.entryDate) : null;
    const observations = data.observations || null;

    await mysqlPool.execute(
      'INSERT INTO supplies (id, name, unit, input_quantity, output_quantity, entry_date, observations, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, name, unit, inputQuantity, outputQuantity, entryDate, observations, now, now],
    );

    return {
      id,
      name,
      unit,
      inputQuantity,
      outputQuantity,
      entryDate,
      observations,
      createdAt: now,
      updatedAt: now,
    };
  }

  async update(id: string, data: UpdateSupplyDto): Promise<SupplyEntity> {
    const updates: string[] = [];
    const params: any[] = [];

    if (data.name !== undefined) {
      updates.push('name = ?');
      params.push(data.name.trim());
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

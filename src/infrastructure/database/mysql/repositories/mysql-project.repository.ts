import { RowDataPacket } from 'mysql2';
import { v4 as uuidv4 } from 'uuid';
import { mysqlPool } from '../mysql.client';
import { Project } from '../../../../domain/projects/project.entity';
import { ProjectStatus } from '../../../../domain/enums/project-status.enum';
import {
  IProjectRepository,
  ProjectWithCount,
  FindAllProjectsOptions,
  PaginatedProjects,
} from '../../../../domain/projects/project.repository.interface';

export class MySQLProjectRepository implements IProjectRepository {
  async findAll(options: FindAllProjectsOptions): Promise<PaginatedProjects> {
    const page = options.page && options.page > 0 ? options.page : 1;
    const limit = options.limit && options.limit > 0 ? options.limit : 20;
    const offset = (page - 1) * limit;

    const whereConditions = ['p.deletedAt IS NULL'];
    const params: any[] = [];

    if (options.status) {
      whereConditions.push('p.status = ?');
      params.push(options.status);
    }

    if (options.search) {
      whereConditions.push('(p.name LIKE ? OR p.address LIKE ? OR p.responsible LIKE ? OR p.description LIKE ?)');
      params.push(`%${options.search}%`, `%${options.search}%`, `%${options.search}%`, `%${options.search}%`);
    }

    const whereClause = whereConditions.join(' AND ');
    const sortBy = options.sortBy === 'startDate' ? 'p.startDate' : options.sortBy === 'createdAt' ? 'p.createdAt' : 'p.name';
    const sortOrder = options.sortOrder?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    const countSql = `SELECT COUNT(*) as total FROM projects p WHERE ${whereClause}`;
    const [countRows] = await mysqlPool.execute<RowDataPacket[]>(countSql, params);
    const total = Number(countRows[0]?.total || 0);

    const sql = `
      SELECT p.id, p.name, p.address, p.responsible, p.status, p.startDate, p.endDate, p.description, p.createdAt, p.updatedAt, p.deletedAt,
             (SELECT COALESCE(SUM(quantity), 0) FROM asset_projects ap WHERE ap.projectId = p.id AND ap.releasedAt IS NULL) AS totalAssets,
             (SELECT COALESCE(SUM(quantity), 0) FROM supply_projects sp WHERE sp.project_id = p.id AND sp.released_at IS NULL) AS totalSupplies
      FROM projects p
      WHERE ${whereClause}
      ORDER BY ${sortBy} ${sortOrder}
      LIMIT ? OFFSET ?
    `;

    const [rows] = await mysqlPool.execute<RowDataPacket[]>(sql, [...params, limit, offset]);

    const data: ProjectWithCount[] = rows.map((row) => ({
      id: row.id,
      name: row.name,
      address: row.address,
      responsible: row.responsible,
      status: row.status as ProjectStatus,
      startDate: row.startDate ? new Date(row.startDate) : null,
      endDate: row.endDate ? new Date(row.endDate) : null,
      description: row.description,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
      deletedAt: row.deletedAt ? new Date(row.deletedAt) : null,
      totalAssets: Number(row.totalAssets || 0),
      totalSupplies: Number(row.totalSupplies || 0),
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

  async findById(id: string): Promise<ProjectWithCount | null> {
    const sql = `
      SELECT p.id, p.name, p.address, p.responsible, p.status, p.startDate, p.endDate, p.description, p.createdAt, p.updatedAt, p.deletedAt,
             (SELECT COALESCE(SUM(quantity), 0) FROM asset_projects ap WHERE ap.projectId = p.id AND ap.releasedAt IS NULL) AS totalAssets,
             (SELECT COALESCE(SUM(quantity), 0) FROM supply_projects sp WHERE sp.project_id = p.id AND sp.released_at IS NULL) AS totalSupplies
      FROM projects p
      WHERE p.id = ? AND p.deletedAt IS NULL
      LIMIT 1
    `;

    const [rows] = await mysqlPool.execute<RowDataPacket[]>(sql, [id]);
    if (!rows.length) return null;

    const row = rows[0];
    return {
      id: row.id,
      name: row.name,
      address: row.address,
      responsible: row.responsible,
      status: row.status as ProjectStatus,
      startDate: row.startDate ? new Date(row.startDate) : null,
      endDate: row.endDate ? new Date(row.endDate) : null,
      description: row.description,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
      deletedAt: row.deletedAt ? new Date(row.deletedAt) : null,
      totalAssets: Number(row.totalAssets || 0),
      totalSupplies: Number(row.totalSupplies || 0),
    };
  }

  async findRawById(id: string): Promise<Project | null> {
    const [rows] = await mysqlPool.execute<RowDataPacket[]>(
      'SELECT id, name, address, responsible, status, startDate, endDate, description, createdAt, updatedAt, deletedAt FROM projects WHERE id = ? AND deletedAt IS NULL LIMIT 1',
      [id],
    );

    if (!rows.length) return null;
    const row = rows[0];
    return {
      id: row.id,
      name: row.name,
      address: row.address,
      responsible: row.responsible,
      status: row.status as ProjectStatus,
      startDate: row.startDate ? new Date(row.startDate) : null,
      endDate: row.endDate ? new Date(row.endDate) : null,
      description: row.description,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
      deletedAt: row.deletedAt ? new Date(row.deletedAt) : null,
    };
  }

  async findByName(name: string): Promise<Project | null> {
    const [rows] = await mysqlPool.execute<RowDataPacket[]>(
      'SELECT id, name, address, responsible, status, startDate, endDate, description, createdAt, updatedAt, deletedAt FROM projects WHERE name = ? AND deletedAt IS NULL LIMIT 1',
      [name],
    );

    if (!rows.length) return null;
    const row = rows[0];
    return {
      id: row.id,
      name: row.name,
      address: row.address,
      responsible: row.responsible,
      status: row.status as ProjectStatus,
      startDate: row.startDate ? new Date(row.startDate) : null,
      endDate: row.endDate ? new Date(row.endDate) : null,
      description: row.description,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
      deletedAt: row.deletedAt ? new Date(row.deletedAt) : null,
    };
  }

  async create(data: {
    name: string;
    address?: string | null;
    responsible?: string | null;
    status?: ProjectStatus;
    startDate?: Date | null;
    endDate?: Date | null;
    description?: string | null;
  }): Promise<Project> {
    const id = uuidv4();
    const now = new Date();
    const status = data.status || ProjectStatus.ACTIVE;

    await mysqlPool.execute(
      'INSERT INTO projects (id, name, address, responsible, status, startDate, endDate, description, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        id,
        data.name,
        data.address || null,
        data.responsible || null,
        status,
        data.startDate || null,
        data.endDate || null,
        data.description || null,
        now,
        now,
      ],
    );

    return {
      id,
      name: data.name,
      address: data.address || null,
      responsible: data.responsible || null,
      status,
      startDate: data.startDate || null,
      endDate: data.endDate || null,
      description: data.description || null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };
  }

  async update(
    id: string,
    data: {
      name?: string;
      address?: string | null;
      responsible?: string | null;
      status?: ProjectStatus;
      startDate?: Date | null;
      endDate?: Date | null;
      description?: string | null;
    },
  ): Promise<Project> {
    const now = new Date();
    const updates: string[] = ['updatedAt = ?'];
    const params: any[] = [now];

    if (data.name !== undefined) { updates.push('name = ?'); params.push(data.name); }
    if (data.address !== undefined) { updates.push('address = ?'); params.push(data.address || null); }
    if (data.responsible !== undefined) { updates.push('responsible = ?'); params.push(data.responsible || null); }
    if (data.status !== undefined) { updates.push('status = ?'); params.push(data.status); }
    if (data.startDate !== undefined) { updates.push('startDate = ?'); params.push(data.startDate || null); }
    if (data.endDate !== undefined) { updates.push('endDate = ?'); params.push(data.endDate || null); }
    if (data.description !== undefined) { updates.push('description = ?'); params.push(data.description || null); }

    params.push(id);

    await mysqlPool.execute(
      `UPDATE projects SET ${updates.join(', ')} WHERE id = ? AND deletedAt IS NULL`,
      params,
    );

    const updated = await this.findRawById(id);
    if (!updated) {
      throw new Error(`Project with id ${id} not found after update`);
    }

    return updated;
  }

  async delete(id: string): Promise<void> {
    await mysqlPool.execute(
      'UPDATE projects SET deletedAt = ? WHERE id = ?',
      [new Date(), id],
    );
  }

  async existsAssets(projectId: string): Promise<boolean> {
    const [rows] = await mysqlPool.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as total FROM asset_projects WHERE projectId = ?',
      [projectId],
    );
    return Number(rows[0]?.total || 0) > 0;
  }
}

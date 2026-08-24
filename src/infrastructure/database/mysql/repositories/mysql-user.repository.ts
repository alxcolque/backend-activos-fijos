import { v4 as uuidv4 } from 'uuid';
import { RowDataPacket } from 'mysql2';
import { mysqlPool } from '../mysql.client';
import {
  IUserRepository,
  FindAllUsersOptions,
  PaginatedUsers,
} from '../../../../domain/users/user.repository.interface';
import { UserEntity, UserRole } from '../../../../domain/users/user.entity';

export class MySQLUserRepository implements IUserRepository {
  async findAll(options: FindAllUsersOptions): Promise<PaginatedUsers> {
    const page = Math.max(1, Number(options.page || 1));
    const limit = Math.max(1, Math.min(100, Number(options.limit || 10)));
    const offset = (page - 1) * limit;

    const whereConditions: string[] = [];
    const params: any[] = [];

    if (options.search) {
      whereConditions.push('(email LIKE ? OR fullName LIKE ?)');
      params.push(`%${options.search}%`, `%${options.search}%`);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const [countRows] = await mysqlPool.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM users ${whereClause}`,
      params,
    );
    const total = Number(countRows[0]?.total || 0);

    const [rows] = await mysqlPool.execute<RowDataPacket[]>(
      `SELECT id, email, fullName, role, isActive, lastLogin, createdAt, updatedAt FROM users ${whereClause} ORDER BY createdAt DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset],
    );

    const data: UserEntity[] = rows.map((r: any) => ({
      id: r.id,
      email: r.email,
      fullName: r.fullName,
      role: (r.role || 'admin') as UserRole,
      isActive: Boolean(r.isActive),
      lastLogin: r.lastLogin ? new Date(r.lastLogin) : null,
      createdAt: new Date(r.createdAt),
      updatedAt: new Date(r.updatedAt),
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

  async findById(id: string): Promise<UserEntity | null> {
    const [rows] = await mysqlPool.execute<RowDataPacket[]>(
      'SELECT id, email, fullName, role, isActive, lastLogin, createdAt, updatedAt FROM users WHERE id = ? LIMIT 1',
      [id],
    );
    if (!rows.length) return null;
    const r = rows[0];
    return {
      id: r.id,
      email: r.email,
      fullName: r.fullName,
      role: (r.role || 'admin') as UserRole,
      isActive: Boolean(r.isActive),
      lastLogin: r.lastLogin ? new Date(r.lastLogin) : null,
      createdAt: new Date(r.createdAt),
      updatedAt: new Date(r.updatedAt),
    };
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const [rows] = await mysqlPool.execute<RowDataPacket[]>(
      'SELECT id, email, fullName, role, isActive, lastLogin, createdAt, updatedAt FROM users WHERE email = ? LIMIT 1',
      [email.toLowerCase().trim()],
    );
    if (!rows.length) return null;
    const r = rows[0];
    return {
      id: r.id,
      email: r.email,
      fullName: r.fullName,
      role: (r.role || 'admin') as UserRole,
      isActive: Boolean(r.isActive),
      lastLogin: r.lastLogin ? new Date(r.lastLogin) : null,
      createdAt: new Date(r.createdAt),
      updatedAt: new Date(r.updatedAt),
    };
  }

  async create(data: { email: string; fullName: string; password: string; role?: UserRole; isActive?: boolean }): Promise<UserEntity> {
    const id = uuidv4();
    const now = new Date();
    const email = data.email.toLowerCase().trim();
    const fullName = data.fullName.trim();
    const role = data.role || 'admin';
    const isActive = data.isActive ?? true;

    await mysqlPool.execute(
      'INSERT INTO users (id, email, fullName, password, role, isActive, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, email, fullName, data.password, role, isActive, now, now],
    );

    return {
      id,
      email,
      fullName,
      role,
      isActive,
      lastLogin: null,
      createdAt: now,
      updatedAt: now,
    };
  }

  async update(
    id: string,
    data: { email?: string; fullName?: string; password?: string; role?: UserRole; isActive?: boolean },
  ): Promise<UserEntity> {
    const updates: string[] = [];
    const params: any[] = [];

    if (data.email !== undefined) {
      updates.push('email = ?');
      params.push(data.email.toLowerCase().trim());
    }
    if (data.fullName !== undefined) {
      updates.push('fullName = ?');
      params.push(data.fullName.trim());
    }
    if (data.password !== undefined) {
      updates.push('password = ?');
      params.push(data.password);
    }
    if (data.role !== undefined) {
      updates.push('role = ?');
      params.push(data.role);
    }
    if (data.isActive !== undefined) {
      updates.push('isActive = ?');
      params.push(data.isActive);
    }

    updates.push('updatedAt = ?');
    params.push(new Date());

    params.push(id);

    await mysqlPool.execute(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);

    const user = await this.findById(id);
    if (!user) throw new Error('Usuario no encontrado tras actualizar.');
    return user;
  }

  async delete(id: string): Promise<boolean> {
    await mysqlPool.execute('DELETE FROM users WHERE id = ?', [id]);
    return true;
  }

  async countActive(): Promise<number> {
    const [rows] = await mysqlPool.execute<RowDataPacket[]>('SELECT COUNT(*) as total FROM users WHERE isActive = 1');
    return Number(rows[0]?.total || 0);
  }
}

export const mysqlUserRepository = new MySQLUserRepository();

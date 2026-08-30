import { RowDataPacket } from 'mysql2';
import { mysqlPool } from '../mysql.client';
import { User } from '../../../../domain/auth/user.entity';
import { IAuthRepository } from '../../../../domain/auth/auth.repository.interface';

export class MySQLAuthRepository implements IAuthRepository {
  async findByEmail(email: string): Promise<User | null> {
    const [rows] = await mysqlPool.execute<RowDataPacket[]>(
      'SELECT id, email, password, fullName, profession, role, isActive, lastLogin, createdAt, updatedAt FROM users WHERE email = ? LIMIT 1',
      [email.toLowerCase().trim()],
    );

    if (!rows.length) return null;
    const row = rows[0];
    return {
      id: row.id,
      email: row.email,
      password: row.password,
      fullName: row.fullName,
      profession: row.profession || null,
      role: row.role || 'operador',
      isActive: Boolean(row.isActive),
      lastLogin: row.lastLogin ? new Date(row.lastLogin) : null,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    };
  }

  async findById(id: string): Promise<User | null> {
    const [rows] = await mysqlPool.execute<RowDataPacket[]>(
      'SELECT id, email, password, fullName, profession, role, isActive, lastLogin, createdAt, updatedAt FROM users WHERE id = ? LIMIT 1',
      [id],
    );

    if (!rows.length) return null;
    const row = rows[0];
    return {
      id: row.id,
      email: row.email,
      password: row.password,
      fullName: row.fullName,
      profession: row.profession || null,
      role: row.role || 'operador',
      isActive: Boolean(row.isActive),
      lastLogin: row.lastLogin ? new Date(row.lastLogin) : null,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    };
  }

  async updateLastLogin(id: string): Promise<void> {
    await mysqlPool.execute(
      'UPDATE users SET lastLogin = ? WHERE id = ?',
      [new Date(), id],
    );
  }
}

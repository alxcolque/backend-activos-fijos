import { RowDataPacket } from 'mysql2';
import { v4 as uuidv4 } from 'uuid';
import { mysqlPool } from '../mysql.client';
import { SystemSetting } from '../../../../domain/settings/setting.entity';
import {
  ISettingRepository,
  CompanySettings,
} from '../../../../domain/settings/setting.repository.interface';

const DEFAULT_SETTINGS: CompanySettings = {
  companyName: 'CORPORACION MINERA DE BOLIVIA - COMIBOL',
  nit: '1020304050',
  address: 'Av. 16 de Julio N° 1616, La Paz - Bolivia',
  phone: '+591 (2) 231-2000',
  email: 'contacto@comibol.gob.bo',
  currency: 'BOB',
  assetPrefix: 'AF',
};

export class MySQLSettingRepository implements ISettingRepository {
  async getAllSettings(): Promise<CompanySettings> {
    const [rows] = await mysqlPool.execute<RowDataPacket[]>(
      'SELECT `key`, `value` FROM system_settings',
    );
    const result = { ...DEFAULT_SETTINGS };

    for (const record of rows) {
      if (record.key in result) {
        (result as any)[record.key] = record.value;
      }
    }

    return result;
  }

  async updateSettings(settings: Partial<CompanySettings>): Promise<CompanySettings> {
    const keys = Object.keys(settings) as (keyof CompanySettings)[];
    const conn = await mysqlPool.getConnection();

    try {
      await conn.beginTransaction();
      const now = new Date();

      for (const key of keys) {
        const val = String(settings[key]);
        const id = uuidv4();

        await conn.execute(
          `INSERT INTO system_settings (id, \`key\`, \`value\`, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE \`value\` = VALUES(\`value\`), updatedAt = VALUES(updatedAt)`,
          [id, key, val, now, now],
        );
      }

      await conn.commit();
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }

    return this.getAllSettings();
  }

  async getByKey(key: string): Promise<SystemSetting | null> {
    const [rows] = await mysqlPool.execute<RowDataPacket[]>(
      'SELECT id, `key`, `value`, description, createdAt, updatedAt FROM system_settings WHERE `key` = ? LIMIT 1',
      [key],
    );

    if (!rows.length) return null;
    const row = rows[0];

    return {
      id: row.id,
      key: row.key,
      value: row.value,
      description: row.description || null,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    };
  }

  async setKey(key: string, value: string, description?: string): Promise<SystemSetting> {
    const now = new Date();
    const id = uuidv4();
    const desc = description || null;

    await mysqlPool.execute(
      `INSERT INTO system_settings (id, \`key\`, \`value\`, description, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE \`value\` = VALUES(\`value\`), description = COALESCE(VALUES(description), description), updatedAt = VALUES(updatedAt)`,
      [id, key, value, desc, now, now],
    );

    const setting = await this.getByKey(key);
    if (!setting) throw new Error(`Setting key ${key} could not be retrieved after setKey`);
    return setting;
  }
}

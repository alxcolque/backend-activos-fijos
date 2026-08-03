import { SystemSetting } from '@prisma/client';
import { prisma } from '../database/prisma.service';
import {
  ISettingRepository,
  CompanySettings,
} from '../../domain/settings/setting.repository.interface';

const DEFAULT_SETTINGS: CompanySettings = {
  companyName: 'CORPORACION MINERA DE BOLIVIA - COMIBOL',
  nit: '1020304050',
  address: 'Av. 16 de Julio N° 1616, La Paz - Bolivia',
  phone: '+591 (2) 231-2000',
  email: 'contacto@comibol.gob.bo',
  currency: 'BOB',
  assetPrefix: 'AF',
};

export class SettingRepository implements ISettingRepository {
  async getAllSettings(): Promise<CompanySettings> {
    const records = await prisma.systemSetting.findMany();
    const result = { ...DEFAULT_SETTINGS };

    for (const record of records) {
      if (record.key in result) {
        (result as any)[record.key] = record.value;
      }
    }

    return result;
  }

  async updateSettings(settings: Partial<CompanySettings>): Promise<CompanySettings> {
    const keys = Object.keys(settings) as (keyof CompanySettings)[];

    await prisma.$transaction(
      keys.map((key) => {
        const val = String(settings[key]);
        return prisma.systemSetting.upsert({
          where: { key },
          update: { value: val },
          create: { key, value: val },
        });
      }),
    );

    return this.getAllSettings();
  }

  async getByKey(key: string): Promise<SystemSetting | null> {
    return prisma.systemSetting.findUnique({
      where: { key },
    });
  }

  async setKey(key: string, value: string, description?: string): Promise<SystemSetting> {
    return prisma.systemSetting.upsert({
      where: { key },
      update: { value, ...(description && { description }) },
      create: { key, value, description: description || null },
    });
  }
}

import { SystemSetting } from './setting.entity';

export interface CompanySettings {
  companyName: string;
  nit: string;
  address: string;
  phone: string;
  email: string;
  currency: string;
  assetPrefix: string;
}

export interface ISettingRepository {
  getAllSettings(): Promise<CompanySettings>;
  updateSettings(settings: Partial<CompanySettings>): Promise<CompanySettings>;
  getByKey(key: string): Promise<SystemSetting | null>;
  setKey(key: string, value: string, description?: string): Promise<SystemSetting>;
}

import { Asset } from '@prisma/client';

export interface ImportRow {
  code: string;
  name: string;
  category?: string;
  status?: string;
  location?: string;
  brand?: string | null;
  model?: string | null;
  serialNumber?: string | null;
  unit?: string;
  quantity?: number;
  purchaseDate?: string | null;
  purchaseValue: number;
  usefulLife: number;
  observations?: string | null;
}

export interface ImportErrorItem {
  row: number;
  code?: string;
  message: string;
}

export interface ImportResult {
  totalRows: number;
  importedCount: number;
  failedCount: number;
  errors: ImportErrorItem[];
}

export interface IImportRepository {
  findDefaultCategory(): Promise<string>;
  findCategoryByName(name: string): Promise<string | null>;
  createCategory(name: string): Promise<string>;
  findDefaultStatus(): Promise<string>;
  findStatusByName(name: string): Promise<string | null>;
  findDefaultLocation(): Promise<string>;
  findLocationByName(name: string): Promise<string | null>;
  existsCode(code: string): Promise<boolean>;
  existsSerial(serial: string): Promise<boolean>;
  bulkCreateAssets(assetsData: any[]): Promise<Asset[]>;
}

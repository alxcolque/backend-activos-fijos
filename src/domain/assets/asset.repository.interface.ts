import { Asset } from '@prisma/client';

export interface AssetListItem {
  id: string;
  code: string;
  qrCode: string | null;
  name: string;
  category: { id: string; name: string; usefulLife?: number };
  status: { id: string; name: string };
  location: { id: string; name: string };
  brand: string | null;
  model: string | null;
  serialNumber: string | null;
  purchaseValue: number | null;
  currentValue: number | null;
  createdAt: Date;
}

export interface AssetDetail extends Asset {
  category: { id: string; name: string; usefulLife?: number };
  status: { id: string; name: string };
  location: { id: string; name: string };
}

export interface FindAllAssetsOptions {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  status?: string;
  location?: string;
  sortBy?: 'code' | 'name' | 'purchaseDate' | 'purchaseValue' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedAssets {
  data: AssetListItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CreateAssetDto {
  code: string;
  qrCode?: string | null;
  name: string;
  description?: string | null;
  categoryId: string;
  statusId: string;
  locationId: string;
  brand?: string | null;
  model?: string | null;
  serialNumber?: string | null;
  unit?: string | null;
  quantity?: number;
  purchaseDate?: Date | null;
  purchaseYear?: number | null;
  purchaseValue?: number | null;
  residualValue?: number | null;
  currentValue?: number | null;
  observations?: string | null;
  photo?: string | null;
}

export interface UpdateAssetDto {
  code?: string;
  name?: string;
  description?: string | null;
  categoryId?: string;
  statusId?: string;
  locationId?: string;
  brand?: string | null;
  model?: string | null;
  serialNumber?: string | null;
  unit?: string | null;
  quantity?: number;
  purchaseDate?: Date | null;
  purchaseYear?: number | null;
  purchaseValue?: number | null;
  residualValue?: number | null;
  currentValue?: number | null;
  observations?: string | null;
  photo?: string | null;
}

export interface IAssetRepository {
  findAll(options: FindAllAssetsOptions): Promise<PaginatedAssets>;
  findById(id: string): Promise<AssetDetail | null>;
  findRawById(id: string): Promise<Asset | null>;
  findByCode(code: string): Promise<AssetDetail | null>;
  findByQr(qrCode: string): Promise<AssetDetail | null>;
  findBySerial(serialNumber: string): Promise<Asset | null>;
  create(data: CreateAssetDto): Promise<Asset>;
  update(id: string, data: UpdateAssetDto): Promise<Asset>;
  delete(id: string): Promise<void>;
  existsCategory(categoryId: string): Promise<boolean>;
  existsStatus(statusId: string): Promise<boolean>;
  existsLocation(locationId: string): Promise<boolean>;
  hasRelatedData(assetId: string): Promise<boolean>;
}

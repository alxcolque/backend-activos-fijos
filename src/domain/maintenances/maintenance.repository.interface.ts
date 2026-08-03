import { AssetMaintenance, MaintenanceType } from '@prisma/client';

export interface AssetMaintenanceDetail extends AssetMaintenance {
  asset?: {
    id: string;
    code: string;
    name: string;
    category?: { id: string; name: string };
    status?: { id: string; name: string };
    location?: { id: string; name: string };
  };
}

export interface FindAllMaintenancesOptions {
  page?: number;
  limit?: number;
  search?: string;
  type?: MaintenanceType;
  assetId?: string;
}

export interface PaginatedMaintenances {
  data: AssetMaintenanceDetail[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CreateMaintenanceDto {
  assetId: string;
  type?: MaintenanceType;
  maintenanceDate: Date;
  provider?: string | null;
  cost?: number | null;
  nextMaintenance?: Date | null;
  observations?: string | null;
}

export interface UpdateMaintenanceDto {
  type?: MaintenanceType;
  maintenanceDate?: Date;
  provider?: string | null;
  cost?: number | null;
  nextMaintenance?: Date | null;
  observations?: string | null;
}

export interface IMaintenanceRepository {
  findAll(options: FindAllMaintenancesOptions): Promise<PaginatedMaintenances>;
  findById(id: string): Promise<AssetMaintenanceDetail | null>;
  findByAssetId(assetId: string, type?: MaintenanceType): Promise<AssetMaintenanceDetail[]>;
  create(data: CreateMaintenanceDto): Promise<AssetMaintenance>;
  update(id: string, data: UpdateMaintenanceDto): Promise<AssetMaintenance>;
  delete(id: string): Promise<void>;
  existsAsset(assetId: string): Promise<boolean>;
}

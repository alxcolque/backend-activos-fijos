import { MaintenanceType } from '../enums/maintenance-type.enum';

export interface AssetMaintenance {
  id: string;
  assetId: string;
  type: MaintenanceType;
  maintenanceDate: Date;
  provider: string | null;
  cost: number | null;
  nextMaintenance: Date | null;
  observations: string | null;
  createdAt: Date;
  updatedAt: Date;
}

import { InventoryStatus } from '../enums/inventory-status.enum';

export interface Inventory {
  id: string;
  name: string;
  inventoryDate: Date;
  locationId: string;
  observations: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface InventoryItem {
  id: string;
  inventoryId: string;
  assetId: string;
  status: InventoryStatus;
  observations: string | null;
  createdAt: Date;
  updatedAt: Date;
}

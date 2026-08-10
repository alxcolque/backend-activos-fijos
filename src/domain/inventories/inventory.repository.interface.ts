import { Inventory, InventoryItem } from './inventory.entity';
import { InventoryStatus } from '../enums/inventory-status.enum';

export interface InventoryDetail extends Inventory {
  location?: {
    id: string;
    name: string;
  };
  stats?: {
    totalItems: number;
    found: number;
    notFound: number;
    damaged: number;
  };
}

export interface InventoryItemDetail extends InventoryItem {
  asset?: {
    id: string;
    code: string;
    name: string;
    category?: { id: string; name: string };
    status?: { id: string; name: string };
  };
}

export interface FindAllInventoriesOptions {
  page?: number;
  limit?: number;
  search?: string;
  locationId?: string;
}

export interface PaginatedInventories {
  data: InventoryDetail[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CreateInventoryDto {
  name: string;
  inventoryDate: Date;
  locationId: string;
  observations?: string | null;
}

export interface RegisterInventoryItemDto {
  inventoryId: string;
  assetId: string;
  status?: InventoryStatus;
  observations?: string | null;
}

export interface IInventoryRepository {
  findAll(options: FindAllInventoriesOptions): Promise<PaginatedInventories>;
  findById(id: string): Promise<InventoryDetail | null>;
  findItemByInventoryAndAsset(inventoryId: string, assetId: string): Promise<InventoryItem | null>;
  findItemsByInventoryId(inventoryId: string): Promise<InventoryItemDetail[]>;
  create(data: CreateInventoryDto): Promise<Inventory>;
  registerItem(data: RegisterInventoryItemDto): Promise<InventoryItem>;
  delete(id: string): Promise<void>;
  existsLocation(locationId: string): Promise<boolean>;
  existsAsset(assetId: string): Promise<boolean>;
}

import { SupplyEntity } from './supply.entity';

export interface FindAllSuppliesOptions {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  locationId?: string;
}

export interface PaginatedSupplies {
  data: SupplyEntity[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CreateSupplyDto {
  name: string;
  categoryId?: string | null;
  locationId?: string | null;
  unit?: string;
  inputQuantity?: number;
  outputQuantity?: number;
  entryDate?: Date | string | null;
  observations?: string | null;
}

export interface UpdateSupplyDto {
  name?: string;
  categoryId?: string | null;
  locationId?: string | null;
  unit?: string;
  inputQuantity?: number;
  outputQuantity?: number;
  entryDate?: Date | string | null;
  observations?: string | null;
}

export interface ISupplyRepository {
  findAll(options: FindAllSuppliesOptions): Promise<PaginatedSupplies>;
  findById(id: string): Promise<SupplyEntity | null>;
  create(data: CreateSupplyDto): Promise<SupplyEntity>;
  update(id: string, data: UpdateSupplyDto): Promise<SupplyEntity>;
  delete(id: string): Promise<boolean>;
}

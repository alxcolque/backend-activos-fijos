import { AcquisitionEntity } from './acquisition.entity';

export interface CreateAcquisitionDetailDTO {
  acquisitionId: string;
  supplyId?: string | null;
  assetId?: string | null;
  unit?: string | null;
  quantity?: number;
}

export interface CreateAcquisitionDTO {
  userId: string;
  projectId?: string | null;
  checkoutUserId?: string | null;
  departureDate?: string | Date | null;
  type?: 'SUPPLY' | 'ASSET' | string;
  details?: {
    supplyId?: string | null;
    assetId?: string | null;
    unit?: string | null;
    quantity?: number;
  }[];
}

export interface UpdateAcquisitionDTO {
  userId?: string;
  projectId?: string | null;
  checkoutUserId?: string | null;
  departureDate?: string | Date | null;
  type?: 'SUPPLY' | 'ASSET' | string;
  details?: {
    supplyId?: string | null;
    assetId?: string | null;
    unit?: string | null;
    quantity?: number;
  }[];
}

export interface QueryAcquisitionOptions {
  page?: number;
  limit?: number;
  search?: string;
  userId?: string;
  projectId?: string;
  checkoutUserId?: string;
  type?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface IAcquisitionRepository {
  findAll(options?: QueryAcquisitionOptions): Promise<{ data: AcquisitionEntity[]; total: number }>;
  findById(id: string): Promise<AcquisitionEntity | null>;
  create(dto: CreateAcquisitionDTO): Promise<AcquisitionEntity>;
  update(id: string, dto: UpdateAcquisitionDTO): Promise<AcquisitionEntity>;
  delete(id: string): Promise<boolean>;
  addDetail(dto: CreateAcquisitionDetailDTO): Promise<any>;
  deleteDetail(detailId: string): Promise<boolean>;
}

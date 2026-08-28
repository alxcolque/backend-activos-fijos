import { AcquisitionEntity } from './acquisition.entity';

export interface CreateAcquisitionDTO {
  userId: string;
  projectUserId?: string | null;
  checkoutUserId?: string | null;
  departureDate?: string | Date | null;
  details?: {
    projectId?: string | null;
    unit?: string | null;
    quantity?: number;
  }[];
}

export interface UpdateAcquisitionDTO {
  userId?: string;
  projectUserId?: string | null;
  checkoutUserId?: string | null;
  departureDate?: string | Date | null;
  details?: {
    projectId?: string | null;
    unit?: string | null;
    quantity?: number;
  }[];
}

export interface QueryAcquisitionOptions {
  page?: number;
  limit?: number;
  search?: string;
  userId?: string;
  projectUserId?: string;
  checkoutUserId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface IAcquisitionRepository {
  findAll(options?: QueryAcquisitionOptions): Promise<{ data: AcquisitionEntity[]; total: number }>;
  findById(id: string): Promise<AcquisitionEntity | null>;
  create(dto: CreateAcquisitionDTO): Promise<AcquisitionEntity>;
  update(id: string, dto: UpdateAcquisitionDTO): Promise<AcquisitionEntity>;
  delete(id: string): Promise<boolean>;
}

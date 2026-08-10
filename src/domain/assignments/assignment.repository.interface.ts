import { AssetAssignment } from './assignment.entity';

export interface AssetAssignmentDetail extends AssetAssignment {
  asset?: {
    id: string;
    code: string;
    name: string;
    category?: { id: string; name: string };
    status?: { id: string; name: string };
    location?: { id: string; name: string };
  };
}

export interface FindAllAssignmentsOptions {
  page?: number;
  limit?: number;
  search?: string;
  assetId?: string;
  activeOnly?: boolean;
}

export interface PaginatedAssignments {
  data: AssetAssignmentDetail[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface IAssignmentRepository {
  findAll(options: FindAllAssignmentsOptions): Promise<PaginatedAssignments>;
  findById(id: string): Promise<AssetAssignmentDetail | null>;
  findActiveAssignmentByAssetId(assetId: string): Promise<AssetAssignment | null>;
  findByAssetId(assetId: string): Promise<AssetAssignmentDetail[]>;
  assign(data: {
    assetId: string;
    responsibleName: string;
    position?: string;
    observations?: string;
  }): Promise<AssetAssignment>;
  returnAsset(id: string, observations?: string): Promise<AssetAssignment>;
  existsAsset(assetId: string): Promise<boolean>;
}

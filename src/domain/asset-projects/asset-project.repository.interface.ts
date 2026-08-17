import { AssetProject } from './asset-project.entity';

export interface AssetProjectDetail extends AssetProject {
  asset?: {
    id: string;
    code: string;
    name: string;
    category?: { id: string; name: string };
    status?: { id: string; name: string };
  };
  project?: {
    id: string;
    code: string;
    name: string;
    type: string;
    status: string;
  };
}

export interface FindAllAssetProjectsOptions {
  page?: number;
  limit?: number;
  projectId?: string;
  assetId?: string;
  activeOnly?: boolean;
}

export interface PaginatedAssetProjects {
  data: AssetProjectDetail[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface IAssetProjectRepository {
  findAll(options: FindAllAssetProjectsOptions): Promise<PaginatedAssetProjects>;
  findActiveAssignmentByAssetId(assetId: string): Promise<AssetProject | null>;
  findActiveAssignment(assetId: string, projectId: string): Promise<AssetProject | null>;
  findByProjectId(projectId: string, activeOnly?: boolean): Promise<AssetProjectDetail[]>;
  findByAssetId(assetId: string): Promise<AssetProjectDetail[]>;
  assign(data: { assetId: string; projectId: string; quantity?: number; observations?: string }): Promise<AssetProject>;
  release(id: string, observations?: string, quantityToRelease?: number): Promise<AssetProject>;
  deleteAssignment(id: string): Promise<boolean>;
  findById(id: string): Promise<AssetProject | null>;
  existsAsset(assetId: string): Promise<boolean>;
  getAssetStock(assetId: string): Promise<{ exists: boolean; name?: string; code?: string; quantity?: number; quantityOut?: number; available?: number }>;
  findProjectStatus(projectId: string): Promise<{ exists: boolean; status?: string; name?: string }>;
}

import { AssetProject } from '@prisma/client';

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
  assign(data: { assetId: string; projectId: string; observations?: string }): Promise<AssetProject>;
  release(id: string, observations?: string): Promise<AssetProject>;
  existsAsset(assetId: string): Promise<boolean>;
  findProjectStatus(projectId: string): Promise<{ exists: boolean; status?: string; name?: string }>;
}

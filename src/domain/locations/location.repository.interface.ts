import { Location } from '@prisma/client';

export interface LocationTreeNode {
  id: string;
  parentId: string | null;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  children: LocationTreeNode[];
}

export interface LocationWithCount extends Location {
  totalAssets?: number;
  totalChildren?: number;
}

export interface FindAllLocationsOptions {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: 'name' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedLocations {
  data: LocationWithCount[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ILocationRepository {
  findAll(options: FindAllLocationsOptions): Promise<PaginatedLocations>;
  findById(id: string): Promise<LocationWithCount | null>;
  findRawById(id: string): Promise<Location | null>;
  findByNameAndParent(name: string, parentId: string | null): Promise<Location | null>;
  findAllRaw(): Promise<Location[]>;
  create(data: { parentId?: string | null; name: string; description?: string }): Promise<Location>;
  update(id: string, data: { parentId?: string | null; name?: string; description?: string }): Promise<Location>;
  delete(id: string): Promise<void>;
  existsChildren(id: string): Promise<boolean>;
  existsAssets(id: string): Promise<boolean>;
  getAllDescendantIds(id: string): Promise<string[]>;
}

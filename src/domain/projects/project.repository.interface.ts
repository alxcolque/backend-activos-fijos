import { Project, ProjectType, ProjectStatus } from '@prisma/client';

export interface ProjectWithCount extends Project {
  totalAssets?: number;
}

export interface FindAllProjectsOptions {
  page?: number;
  limit?: number;
  search?: string;
  type?: ProjectType;
  status?: ProjectStatus;
  sortBy?: 'name' | 'code' | 'startDate' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedProjects {
  data: ProjectWithCount[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface IProjectRepository {
  findAll(options: FindAllProjectsOptions): Promise<PaginatedProjects>;
  findById(id: string): Promise<ProjectWithCount | null>;
  findRawById(id: string): Promise<Project | null>;
  findByCode(code: string): Promise<Project | null>;
  findByName(name: string): Promise<Project | null>;
  create(data: {
    code: string;
    name: string;
    type?: ProjectType;
    status?: ProjectStatus;
    startDate?: Date | null;
    endDate?: Date | null;
    description?: string | null;
  }): Promise<Project>;
  update(
    id: string,
    data: {
      code?: string;
      name?: string;
      type?: ProjectType;
      status?: ProjectStatus;
      startDate?: Date | null;
      endDate?: Date | null;
      description?: string | null;
    },
  ): Promise<Project>;
  delete(id: string): Promise<void>;
  existsAssets(projectId: string): Promise<boolean>;
}

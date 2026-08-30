import { Project } from './project.entity';
import { ProjectStatus } from '../enums/project-status.enum';

export interface ProjectWithCount extends Project {
  totalAssets?: number;
  totalSupplies?: number;
}

export interface FindAllProjectsOptions {
  page?: number;
  limit?: number;
  search?: string;
  status?: ProjectStatus;
  sortBy?: 'name' | 'startDate' | 'createdAt';
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
  findByName(name: string): Promise<Project | null>;
  create(data: {
    name: string;
    address?: string | null;
    responsible?: string | null;
    status?: ProjectStatus;
    startDate?: Date | null;
    endDate?: Date | null;
    description?: string | null;
  }): Promise<Project>;
  update(
    id: string,
    data: {
      name?: string;
      address?: string | null;
      responsible?: string | null;
      status?: ProjectStatus;
      startDate?: Date | null;
      endDate?: Date | null;
      description?: string | null;
    },
  ): Promise<Project>;
  delete(id: string): Promise<void>;
  existsAssets(projectId: string): Promise<boolean>;
}

import { SupplyProjectEntity } from './supply-project.entity';

export interface AssignSupplyToProjectDto {
  supplyId: string;
  projectId: string;
  quantity: number;
  outputQuantity?: number;
  observations?: string | null;
}

export interface ReleaseSupplyFromProjectDto {
  id: string;
  quantityToRelease?: number;
  observations?: string | null;
}

export interface ISupplyProjectRepository {
  findByProjectId(projectId: string): Promise<SupplyProjectEntity[]>;
  findById(id: string): Promise<SupplyProjectEntity | null>;
  assign(data: AssignSupplyToProjectDto): Promise<SupplyProjectEntity>;
  release(data: ReleaseSupplyFromProjectDto): Promise<SupplyProjectEntity>;
  delete(id: string): Promise<boolean>;
}

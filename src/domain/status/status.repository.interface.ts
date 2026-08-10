import { AssetStatus } from './status.entity';

export interface StatusWithCount extends AssetStatus {
  totalAssets?: number;
}

export interface IStatusRepository {
  findAll(search?: string): Promise<StatusWithCount[]>;
  findById(id: string): Promise<StatusWithCount | null>;
  findByName(name: string): Promise<AssetStatus | null>;
  create(data: { name: string; description?: string }): Promise<AssetStatus>;
  update(id: string, data: { name?: string; description?: string }): Promise<AssetStatus>;
  delete(id: string): Promise<void>;
  countAssets(statusId: string): Promise<number>;
}

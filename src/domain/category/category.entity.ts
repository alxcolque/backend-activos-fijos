export interface AssetCategory {
  id: string;
  name: string;
  description: string | null;
  type: 'ASSET' | 'SUPPLY';
  usefulLife: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface AssetCategory {
  id: string;
  name: string;
  description: string | null;
  usefulLife: number;
  createdAt: Date;
  updatedAt: Date;
}

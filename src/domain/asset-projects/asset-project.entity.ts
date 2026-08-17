export interface AssetProject {
  id: string;
  assetId: string;
  projectId: string;
  quantity: number;
  assignedAt: Date;
  releasedAt: Date | null;
  observations: string | null;
}

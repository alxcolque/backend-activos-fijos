export interface AssetProject {
  id: string;
  assetId: string;
  projectId: string;
  assignedAt: Date;
  releasedAt: Date | null;
  observations: string | null;
}

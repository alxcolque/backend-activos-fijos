export interface AssetAssignment {
  id: string;
  assetId: string;
  responsibleName: string;
  position: string | null;
  assignedAt: Date;
  returnedAt: Date | null;
  observations: string | null;
  createdAt: Date;
  updatedAt: Date;
}

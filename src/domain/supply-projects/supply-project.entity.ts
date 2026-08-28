export interface SupplyProjectEntity {
  id: string;
  supplyId: string;
  projectId: string;
  quantity: number;
  outputQuantity: number;
  assignedAt: Date;
  releasedAt: Date | null;
  observations: string | null;
  createdAt: Date;
  updatedAt: Date;
  supply?: {
    id: string;
    name: string;
    unit: string;
    categoryId?: string | null;
    locationId?: string | null;
    category?: { id: string; name: string } | null;
    location?: { id: string; name: string } | null;
  } | null;
  project?: {
    id: string;
    name: string;
  } | null;
}

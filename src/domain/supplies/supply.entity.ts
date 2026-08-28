export interface SupplyEntity {
  id: string;
  name: string;
  categoryId: string | null;
  locationId: string | null;
  unit: string;
  inputQuantity: number;
  outputQuantity: number;
  entryDate: Date | null;
  observations: string | null;
  createdAt: Date;
  updatedAt: Date;
  category?: { id: string; name: string } | null;
  location?: { id: string; name: string } | null;
}

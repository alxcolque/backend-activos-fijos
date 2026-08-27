export interface SupplyEntity {
  id: string;
  name: string;
  unit: string;
  inputQuantity: number;
  outputQuantity: number;
  entryDate: Date | null;
  observations: string | null;
  createdAt: Date;
  updatedAt: Date;
}

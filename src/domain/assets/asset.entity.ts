export interface Asset {
  id: string;
  code: string;
  qrCode: string | null;
  name: string;
  description: string | null;
  categoryId: string;
  statusId: string;
  locationId: string;
  brand: string | null;
  model: string | null;
  serialNumber: string | null;
  unit: string | null;
  quantity: number;
  purchaseDate: Date | null;
  purchaseYear: number | null;
  purchaseValue: number | null;
  residualValue: number | null;
  currentValue: number | null;
  observations: string | null;
  photo: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

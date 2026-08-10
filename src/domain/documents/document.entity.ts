import { DocumentType } from '../enums/document-type.enum';

export interface AssetDocument {
  id: string;
  assetId: string;
  type: DocumentType;
  fileName: string;
  originalName: string;
  mimeType: string;
  extension: string;
  size: number;
  path: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

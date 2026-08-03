import { AssetDocument, DocumentType } from '@prisma/client';

export interface AssetDocumentDetail extends AssetDocument {
  asset?: {
    id: string;
    code: string;
    name: string;
  };
}

export interface FindAllDocumentsOptions {
  page?: number;
  limit?: number;
  search?: string;
  type?: DocumentType;
  assetId?: string;
}

export interface PaginatedDocuments {
  data: AssetDocumentDetail[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CreateDocumentDto {
  assetId: string;
  type?: DocumentType;
  fileName: string;
  originalName: string;
  mimeType: string;
  extension: string;
  size: number;
  path: string;
  description?: string | null;
}

export interface IDocumentRepository {
  findAll(options: FindAllDocumentsOptions): Promise<PaginatedDocuments>;
  findById(id: string): Promise<AssetDocumentDetail | null>;
  findByAssetId(assetId: string, type?: DocumentType): Promise<AssetDocument[]>;
  create(data: CreateDocumentDto): Promise<AssetDocument>;
  delete(id: string): Promise<void>;
  existsAsset(assetId: string): Promise<boolean>;
}

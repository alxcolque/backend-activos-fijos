import { AssetDocument, DocumentType } from '@prisma/client';
import { prisma } from '../database/prisma.service';
import {
  IDocumentRepository,
  AssetDocumentDetail,
  FindAllDocumentsOptions,
  PaginatedDocuments,
  CreateDocumentDto,
} from '../../domain/documents/document.repository.interface';

export class DocumentRepository implements IDocumentRepository {
  async findAll(options: FindAllDocumentsOptions): Promise<PaginatedDocuments> {
    const page = options.page && options.page > 0 ? options.page : 1;
    const limit = options.limit && options.limit > 0 ? options.limit : 20;
    const skip = (page - 1) * limit;

    const whereCondition: any = {};

    if (options.assetId) {
      whereCondition.assetId = options.assetId;
    }

    if (options.type) {
      whereCondition.type = options.type;
    }

    if (options.search) {
      whereCondition.OR = [
        { fileName: { contains: options.search } },
        { originalName: { contains: options.search } },
        { description: { contains: options.search } },
        { asset: { code: { contains: options.search } } },
        { asset: { name: { contains: options.search } } },
      ];
    }

    const [total, items] = await Promise.all([
      prisma.assetDocument.count({ where: whereCondition }),
      prisma.assetDocument.findMany({
        where: whereCondition,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          asset: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
        },
      }),
    ]);

    return {
      data: items as unknown as AssetDocumentDetail[],
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async findById(id: string): Promise<AssetDocumentDetail | null> {
    const item = await prisma.assetDocument.findUnique({
      where: { id },
      include: {
        asset: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
      },
    });

    return item as unknown as AssetDocumentDetail | null;
  }

  async findByAssetId(assetId: string, type?: DocumentType): Promise<AssetDocument[]> {
    const whereCondition: any = { assetId };
    if (type) {
      whereCondition.type = type;
    }

    return prisma.assetDocument.findMany({
      where: whereCondition,
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(data: CreateDocumentDto): Promise<AssetDocument> {
    return prisma.assetDocument.create({
      data: {
        assetId: data.assetId,
        type: data.type || 'OTHER',
        fileName: data.fileName,
        originalName: data.originalName,
        mimeType: data.mimeType,
        extension: data.extension,
        size: data.size,
        path: data.path,
        description: data.description || null,
      },
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.assetDocument.delete({
      where: { id },
    });
  }

  async existsAsset(assetId: string): Promise<boolean> {
    const count = await prisma.asset.count({ where: { id: assetId, deletedAt: null } });
    return count > 0;
  }
}

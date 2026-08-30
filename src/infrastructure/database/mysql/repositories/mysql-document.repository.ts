import { RowDataPacket } from 'mysql2';
import { v4 as uuidv4 } from 'uuid';
import { mysqlPool } from '../mysql.client';
import { AssetDocument } from '../../../../domain/documents/document.entity';
import { DocumentType } from '../../../../domain/enums/document-type.enum';
import {
  IDocumentRepository,
  AssetDocumentDetail,
  FindAllDocumentsOptions,
  PaginatedDocuments,
  CreateDocumentDto,
} from '../../../../domain/documents/document.repository.interface';

export class MySQLDocumentRepository implements IDocumentRepository {
  private mapRow(row: any): AssetDocument {
    return {
      id: row.id,
      assetId: row.assetId,
      type: row.type as DocumentType,
      fileName: row.fileName,
      originalName: row.originalName,
      mimeType: row.mimeType,
      extension: row.extension,
      size: Number(row.size),
      path: row.path,
      description: row.description || null,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    };
  }

  async findAll(options: FindAllDocumentsOptions): Promise<PaginatedDocuments> {
    const page = options.page && options.page > 0 ? options.page : 1;
    const limit = options.limit && options.limit > 0 ? options.limit : 20;
    const offset = (page - 1) * limit;

    const whereConditions: string[] = [];
    const params: any[] = [];

    if (options.assetId) {
      whereConditions.push('d.assetId = ?');
      params.push(options.assetId);
    }
    if (options.type) {
      whereConditions.push('d.type = ?');
      params.push(options.type);
    }
    if (options.search) {
      whereConditions.push('(d.fileName LIKE ? OR d.originalName LIKE ? OR d.description LIKE ? OR a.code LIKE ? OR a.name LIKE ?)');
      const s = `%${options.search}%`;
      params.push(s, s, s, s, s);
    }

    const whereClause = whereConditions.length ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const countSql = `
      SELECT COUNT(*) as total
      FROM asset_documents d
      LEFT JOIN assets a ON a.id = d.assetId
      ${whereClause}
    `;
    const [countRows] = await mysqlPool.query<RowDataPacket[]>(countSql, params);
    const total = Number(countRows[0]?.total || 0);

    const sql = `
      SELECT d.*, a.code AS assetCode, a.name AS assetName
      FROM asset_documents d
      LEFT JOIN assets a ON a.id = d.assetId
      ${whereClause}
      ORDER BY d.createdAt DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const [rows] = await mysqlPool.query<RowDataPacket[]>(sql, params);

    const data: AssetDocumentDetail[] = rows.map((row) => ({
      ...this.mapRow(row),
      asset: {
        id: row.assetId,
        code: row.assetCode,
        name: row.assetName,
      },
    }));

    return {
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async findById(id: string): Promise<AssetDocumentDetail | null> {
    const sql = `
      SELECT d.*, a.code AS assetCode, a.name AS assetName
      FROM asset_documents d
      LEFT JOIN assets a ON a.id = d.assetId
      WHERE d.id = ?
      LIMIT 1
    `;

    const [rows] = await mysqlPool.execute<RowDataPacket[]>(sql, [id]);
    if (!rows.length) return null;

    const row = rows[0];
    return {
      ...this.mapRow(row),
      asset: {
        id: row.assetId,
        code: row.assetCode,
        name: row.assetName,
      },
    };
  }

  async findByAssetId(assetId: string, type?: DocumentType): Promise<AssetDocument[]> {
    const whereConditions = ['assetId = ?'];
    const params: any[] = [assetId];

    if (type) {
      whereConditions.push('type = ?');
      params.push(type);
    }

    const [rows] = await mysqlPool.execute<RowDataPacket[]>(
      `SELECT * FROM asset_documents WHERE ${whereConditions.join(' AND ')} ORDER BY createdAt DESC`,
      params,
    );

    return rows.map((r) => this.mapRow(r));
  }

  async create(data: CreateDocumentDto): Promise<AssetDocument> {
    const id = uuidv4();
    const now = new Date();
    const type = data.type || DocumentType.OTHER;

    await mysqlPool.execute(
      `INSERT INTO asset_documents (
        id, assetId, type, fileName, originalName, mimeType, extension, size, path, description, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.assetId,
        type,
        data.fileName,
        data.originalName,
        data.mimeType,
        data.extension,
        data.size,
        data.path,
        data.description || null,
        now,
        now,
      ],
    );

    return {
      id,
      assetId: data.assetId,
      type,
      fileName: data.fileName,
      originalName: data.originalName,
      mimeType: data.mimeType,
      extension: data.extension,
      size: data.size,
      path: data.path,
      description: data.description || null,
      createdAt: now,
      updatedAt: now,
    };
  }

  async delete(id: string): Promise<void> {
    await mysqlPool.execute('DELETE FROM asset_documents WHERE id = ?', [id]);
  }

  async existsAsset(assetId: string): Promise<boolean> {
    const [rows] = await mysqlPool.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as total FROM assets WHERE id = ? AND deletedAt IS NULL',
      [assetId],
    );
    return Number(rows[0]?.total || 0) > 0;
  }
}

import { FastifyRequest, FastifyReply } from 'fastify';
import { RepositoryFactory } from '../../../infrastructure/database/repository.factory';
import { GetAssetsUseCase } from '../../../application/assets/getAll/get-assets.usecase';
import { GetAssetUseCase } from '../../../application/assets/get/get-asset.usecase';
import { GetAssetByCodeUseCase } from '../../../application/assets/getByCode/get-asset-by-code.usecase';
import { GetAssetByQrUseCase } from '../../../application/assets/getByQr/get-asset-by-qr.usecase';
import { CreateAssetUseCase } from '../../../application/assets/create/create-asset.usecase';
import { UpdateAssetUseCase } from '../../../application/assets/update/update-asset.usecase';
import { DeleteAssetUseCase } from '../../../application/assets/delete/delete-asset.usecase';
import {
  createAssetSchema,
  updateAssetSchema,
  queryAssetSchema,
} from '../../validators/assets/asset.validator';
import { UploadService } from '../../../infrastructure/services/upload.service';
import { successResponse } from '../../../shared/utils/response.util';
import { generateAssetsWordReport } from '../../../shared/utils/assets-word-report.util';
import { generateAssetsExcelReport } from '../../../shared/utils/assets-excel-report.util';

const assetRepository = RepositoryFactory.getAssetRepository();
const uploadService = new UploadService();
const getAssetsUseCase = new GetAssetsUseCase(assetRepository);
const getAssetUseCase = new GetAssetUseCase(assetRepository);
const getAssetByCodeUseCase = new GetAssetByCodeUseCase(assetRepository);
const getAssetByQrUseCase = new GetAssetByQrUseCase(assetRepository);
const createAssetUseCase = new CreateAssetUseCase(assetRepository);
const updateAssetUseCase = new UpdateAssetUseCase(assetRepository, uploadService);
const deleteAssetUseCase = new DeleteAssetUseCase(assetRepository);

export class AssetController {
  public static async getAssets(request: FastifyRequest, reply: FastifyReply) {
    const validatedQuery = queryAssetSchema.parse(request.query);
    const result = await getAssetsUseCase.execute(validatedQuery);
    return reply.status(200).send({
      success: true,
      message: 'Activos fijos obtenidos correctamente.',
      data: result.data,
      pagination: result.pagination,
    });
  }

  public static async getAssetById(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const { calculationDate } = (request.query as { calculationDate?: string }) || {};
    const asset = await getAssetUseCase.execute(id, calculationDate);
    return reply.status(200).send(successResponse(asset));
  }

  public static async getAssetByCode(request: FastifyRequest, reply: FastifyReply) {
    const { code } = request.params as { code: string };
    const asset = await getAssetByCodeUseCase.execute(code);
    return reply.status(200).send(successResponse(asset));
  }

  public static async getAssetByQr(request: FastifyRequest, reply: FastifyReply) {
    const { qrCode } = request.params as { qrCode: string };
    const asset = await getAssetByQrUseCase.execute(qrCode);
    return reply.status(200).send(successResponse(asset));
  }

  public static async createAsset(request: FastifyRequest, reply: FastifyReply) {
    const validatedBody = createAssetSchema.parse(request.body);
    const userId = request.user?.id;
    const asset = await createAssetUseCase.execute(validatedBody, userId);
    return reply.status(201).send(successResponse(asset, 'Activo fijo creado exitosamente.'));
  }

  public static async updateAsset(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const validatedBody = updateAssetSchema.parse(request.body);
    const userId = request.user?.id;
    const asset = await updateAssetUseCase.execute(id, validatedBody, userId);
    return reply.status(200).send(successResponse(asset, 'Activo fijo actualizado exitosamente.'));
  }

  public static async deleteAsset(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const userId = request.user?.id;
    const result = await deleteAssetUseCase.execute(id, userId);
    return reply.status(200).send(successResponse(null, result.message));
  }

  public static async downloadWordReport(request: FastifyRequest, reply: FastifyReply) {
    const query = (request.query as {
      search?: string;
      category?: string;
      status?: string;
      location?: string;
      pageSize?: string;
      orientation?: string;
    }) || {};

    const body = (request.body as {
      search?: string;
      category?: string;
      status?: string;
      location?: string;
      pageSize?: string;
      orientation?: string;
    }) || {};

    const search = query.search || body.search || undefined;
    const category = query.category || body.category || undefined;
    const status = query.status || body.status || undefined;
    const location = query.location || body.location || undefined;

    const pageSize = (query.pageSize || body.pageSize || 'carta') as 'carta' | 'a4' | 'oficio';
    const orientation = (query.orientation || body.orientation || 'horizontal') as 'vertical' | 'horizontal';

    const result = await getAssetsUseCase.execute({
      page: 1,
      limit: 10000,
      search,
      category,
      status,
      location,
      sortBy: 'code',
      sortOrder: 'asc',
    });

    const wordBuffer = await generateAssetsWordReport(result.data, { pageSize, orientation });

    const filename = `Reporte_Activos_Fijos_COMIBOL.docx`;

    return reply
      .header('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
      .header('Content-Disposition', `attachment; filename="${filename}"`)
      .send(wordBuffer);
  }

  public static async downloadExcelReport(request: FastifyRequest, reply: FastifyReply) {
    try {
      const query = (request.query as {
        search?: string;
        category?: string;
        status?: string;
        location?: string;
        calculationDate?: string;
        currency?: string;
        exchangeRate?: number;
      }) || {};

      const body = (request.body as {
        search?: string;
        category?: string;
        status?: string;
        location?: string;
        calculationDate?: string;
        currency?: string;
        exchangeRate?: number;
      }) || {};

      const search = query.search || body.search || undefined;
      const category = query.category || body.category || undefined;
      const status = query.status || body.status || undefined;
      const location = query.location || body.location || undefined;
      const calculationDate = query.calculationDate || body.calculationDate || undefined;
      const currency = (query.currency || body.currency || 'BOB') as 'BOB' | 'USD';
      const exchangeRate = Number(query.exchangeRate || body.exchangeRate || 11.86);

      const result = await getAssetsUseCase.execute({
        page: 1,
        limit: 10000,
        search,
        category,
        status,
        location,
        calculationDate,
        sortBy: 'code',
        sortOrder: 'asc',
      });

      const excelBuffer = await generateAssetsExcelReport(result.data, {
        calculationDate,
        currency,
        exchangeRate,
      });

      const filename = `Reporte_Activos_Fijos_COMIBOL.xlsx`;

      return reply
        .header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        .header('Content-Disposition', `attachment; filename="${filename}"`)
        .send(excelBuffer);
    } catch (error: any) {
      console.error('Error al generar el reporte Excel de activos fijos:', error);
      return reply.status(500).send({
        success: false,
        message: error.message || 'Error interno al generar el reporte Excel',
      });
    }
  }
}

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
    const asset = await getAssetUseCase.execute(id);
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
}

import { FastifyRequest, FastifyReply } from 'fastify';
import { SettingRepository } from '../../infrastructure/repositories/setting.repository';
import { GetSettingsUseCase } from '../../application/settings/get-settings/get-settings.usecase';
import { UpdateSettingsUseCase } from '../../application/settings/update-settings/update-settings.usecase';
import { GetSettingByKeyUseCase } from '../../application/settings/get-setting-by-key/get-setting-by-key.usecase';
import {
  updateSettingsSchema,
  updateSingleSettingSchema,
} from '../validators/settings/setting.validator';
import { successResponse } from '../../shared/utils/response.util';

const repository = new SettingRepository();
const getSettingsUseCase = new GetSettingsUseCase(repository);
const updateSettingsUseCase = new UpdateSettingsUseCase(repository);
const getSettingByKeyUseCase = new GetSettingByKeyUseCase(repository);

export class SettingController {
  public static async getSettings(_request: FastifyRequest, reply: FastifyReply) {
    const settings = await getSettingsUseCase.execute();
    return reply.status(200).send(successResponse(settings));
  }

  public static async updateSettings(request: FastifyRequest, reply: FastifyReply) {
    const validatedBody = updateSettingsSchema.parse(request.body);
    const updated = await updateSettingsUseCase.execute(validatedBody);
    return reply.status(200).send(successResponse(updated, 'Configuración institucional actualizada exitosamente.'));
  }

  public static async getSettingByKey(request: FastifyRequest, reply: FastifyReply) {
    const { key } = request.params as { key: string };
    const setting = await getSettingByKeyUseCase.execute(key);
    return reply.status(200).send(successResponse(setting));
  }

  public static async updateSingleSetting(request: FastifyRequest, reply: FastifyReply) {
    const { key } = request.params as { key: string };
    const validatedBody = updateSingleSettingSchema.parse(request.body);
    const setting = await repository.setKey(key, validatedBody.value, validatedBody.description);
    return reply.status(200).send(successResponse(setting, `Parámetro '${key}' actualizado exitosamente.`));
  }
}

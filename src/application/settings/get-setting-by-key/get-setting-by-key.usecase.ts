import { ISettingRepository } from '../../../domain/settings/setting.repository.interface';
import { NotFoundError } from '../../../shared/errors/app-error';

export class GetSettingByKeyUseCase {
  constructor(private settingRepository: ISettingRepository) {}

  async execute(key: string) {
    const setting = await this.settingRepository.getByKey(key);

    if (!setting) {
      const all = await this.settingRepository.getAllSettings();
      if (key in all) {
        return { key, value: (all as any)[key] };
      }
      throw new NotFoundError(`Parámetro de configuración '${key}' no encontrado.`);
    }

    return setting;
  }
}

import {
  ISettingRepository,
  CompanySettings,
} from '../../../domain/settings/setting.repository.interface';
import { logger } from '../../../infrastructure/logger/logger';

export class UpdateSettingsUseCase {
  constructor(private settingRepository: ISettingRepository) {}

  async execute(settings: Partial<CompanySettings>) {
    logger.info({ settings }, 'Actualización de configuraciones institucionales');
    return this.settingRepository.updateSettings(settings);
  }
}

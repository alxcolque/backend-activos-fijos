import { ISettingRepository } from '../../../domain/settings/setting.repository.interface';
import { logger } from '../../../infrastructure/logger/logger';

export class GetSettingsUseCase {
  constructor(private settingRepository: ISettingRepository) {}

  async execute() {
    logger.info('Consulta de configuraciones institucionales');
    return this.settingRepository.getAllSettings();
  }
}

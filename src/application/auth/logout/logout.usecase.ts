import { logger } from '../../../infrastructure/logger/logger';

export class LogoutUseCase {
  async execute(userId?: string) {
    if (userId) {
      logger.info({ userId }, 'Sesión cerrada por el usuario');
    }
    return {
      message: 'Sesión finalizada.',
    };
  }
}

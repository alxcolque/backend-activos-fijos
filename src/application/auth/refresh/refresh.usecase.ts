import jwt, { SignOptions } from 'jsonwebtoken';
import { IAuthRepository } from '../../../domain/auth/auth.repository.interface';
import { UnauthorizedError } from '../../../shared/errors/app-error';
import { env } from '../../../infrastructure/config/env';
import { logger } from '../../../infrastructure/logger/logger';

export class RefreshTokenUseCase {
  constructor(private authRepository: IAuthRepository) {}

  async execute(refreshToken: string) {
    try {
      const decoded = jwt.verify(refreshToken, env.JWT_SECRET) as { id: string; email: string };

      const user = await this.authRepository.findById(decoded.id);

      if (!user || !user.isActive) {
        throw new UnauthorizedError('Usuario inactivo o no autorizado');
      }

      const payload = { id: user.id, email: user.email };
      const newAccessToken = jwt.sign(payload, env.JWT_SECRET, {
        expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'],
      });

      logger.info({ userId: user.id }, 'Token de acceso renovado exitosamente');

      return {
        accessToken: newAccessToken,
      };
    } catch (error) {
      logger.warn({ error }, 'Intento fallido de renovar token');
      throw new UnauthorizedError('Refresh token inválido o expirado');
    }
  }
}

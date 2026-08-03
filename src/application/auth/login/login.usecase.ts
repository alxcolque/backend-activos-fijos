import * as bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';
import { IAuthRepository } from '../../../domain/auth/auth.repository.interface';
import { LoginInput } from '../../../interfaces/validators/auth/auth.validator';
import { AppError } from '../../../shared/errors/app-error';
import { env } from '../../../infrastructure/config/env';
import { logger } from '../../../infrastructure/logger/logger';

export class LoginUseCase {
  constructor(private authRepository: IAuthRepository) {}

  async execute(input: LoginInput) {
    const user = await this.authRepository.findByEmail(input.email);

    if (!user) {
      logger.warn({ email: input.email }, 'Intento de inicio de sesión fallido: correo inexistente');
      throw new AppError('Credenciales incorrectas.', 400);
    }

    const isPasswordValid = await bcrypt.compare(input.password, user.password);

    if (!isPasswordValid) {
      logger.warn({ email: input.email }, 'Intento de inicio de sesión fallido: contraseña incorrecta');
      throw new AppError('Credenciales incorrectas.', 400);
    }

    if (!user.isActive) {
      logger.warn({ email: input.email }, 'Intento de inicio de sesión fallido: usuario inactivo');
      throw new AppError('Usuario inactivo.', 400);
    }

    await this.authRepository.updateLastLogin(user.id);

    const payload = { id: user.id, email: user.email };

    const accessToken = jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'],
    });

    const refreshToken = jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_REFRESH_EXPIRES_IN as SignOptions['expiresIn'],
    });

    logger.info({ userId: user.id, email: user.email }, 'Inicio de sesión exitoso');

    return {
      accessToken,
      refreshToken,
      token: accessToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
      },
    };
  }
}

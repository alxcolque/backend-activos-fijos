import { FastifyRequest, FastifyReply } from 'fastify';
import { RepositoryFactory } from '../../../infrastructure/database/repository.factory';
import { LoginUseCase } from '../../../application/auth/login/login.usecase';
import { ProfileUseCase } from '../../../application/auth/profile/profile.usecase';
import { RefreshTokenUseCase } from '../../../application/auth/refresh/refresh.usecase';
import { LogoutUseCase } from '../../../application/auth/logout/logout.usecase';
import { loginSchema, refreshSchema } from '../../validators/auth/auth.validator';
import { successResponse } from '../../../shared/utils/response.util';

const authRepository = RepositoryFactory.getAuthRepository();
const loginUseCase = new LoginUseCase(authRepository);
const profileUseCase = new ProfileUseCase(authRepository);
const refreshTokenUseCase = new RefreshTokenUseCase(authRepository);
const logoutUseCase = new LogoutUseCase();

export class AuthController {
  public static async login(request: FastifyRequest, reply: FastifyReply) {
    const validatedBody = loginSchema.parse(request.body);
    const result = await loginUseCase.execute(validatedBody);
    return reply.status(200).send(successResponse(result, 'Inicio de sesión exitoso.'));
  }

  public static async profile(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.user?.id;
    const result = await profileUseCase.execute(userId!);
    return reply.status(200).send(successResponse(result));
  }

  public static async refresh(request: FastifyRequest, reply: FastifyReply) {
    const validatedBody = refreshSchema.parse(request.body);
    const result = await refreshTokenUseCase.execute(validatedBody.refreshToken);
    return reply.status(200).send(successResponse(result));
  }

  public static async logout(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.user?.id;
    const result = await logoutUseCase.execute(userId);
    return reply.status(200).send(successResponse(null, result.message));
  }
}

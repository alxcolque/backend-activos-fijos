import { IAuthRepository } from '../../../domain/auth/auth.repository.interface';
import { UnauthorizedError } from '../../../shared/errors/app-error';

export class ProfileUseCase {
  constructor(private authRepository: IAuthRepository) {}

  async execute(userId: string) {
    const user = await this.authRepository.findById(userId);

    if (!user || !user.isActive) {
      throw new UnauthorizedError('Usuario no encontrado o inactivo');
    }

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
    };
  }
}

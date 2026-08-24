import { IUserRepository } from '../../domain/users/user.repository.interface';
import { NotFoundError, AppError } from '../../shared/errors/app-error';

export class DeleteUserUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(id: string, currentUserId?: string) {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundError('Usuario no encontrado.');
    }

    if (currentUserId && id === currentUserId) {
      throw new AppError('No puede eliminar su propio usuario actualmente en sesión.', 400);
    }

    const activeCount = await this.userRepository.countActive();
    if (activeCount <= 1 && user.isActive) {
      throw new AppError('No se puede eliminar el único usuario activo del sistema.', 400);
    }

    await this.userRepository.delete(id);
    return { message: 'Usuario eliminado exitosamente.' };
  }
}

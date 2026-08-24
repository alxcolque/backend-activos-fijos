import { IUserRepository } from '../../domain/users/user.repository.interface';
import { NotFoundError } from '../../shared/errors/app-error';

export class GetUserByIdUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(id: string) {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundError('Usuario no encontrado.');
    }
    return user;
  }
}

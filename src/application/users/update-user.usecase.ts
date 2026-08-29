import bcrypt from 'bcryptjs';
import { IUserRepository } from '../../domain/users/user.repository.interface';
import { UpdateUserInput } from '../../interfaces/validators/users/user.validator';
import { NotFoundError, ConflictError } from '../../shared/errors/app-error';

export class UpdateUserUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(id: string, input: UpdateUserInput) {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundError('Usuario no encontrado.');
    }

    if (input.email && input.email.toLowerCase() !== user.email.toLowerCase()) {
      const existing = await this.userRepository.findByEmail(input.email);
      if (existing && existing.id !== id) {
        throw new ConflictError('El correo electrónico ya está en uso por otro usuario.');
      }
    }

    let hashedPassword: string | undefined = undefined;
    if (input.password && input.password.trim().length > 0) {
      hashedPassword = await bcrypt.hash(input.password, 10);
    }

    return this.userRepository.update(id, {
      email: input.email,
      fullName: input.fullName,
      profession: input.profession,
      projectId: input.projectId,
      password: hashedPassword,
      role: input.role,
      isActive: input.isActive,
    });
  }
}

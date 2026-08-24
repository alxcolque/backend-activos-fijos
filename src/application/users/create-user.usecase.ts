import bcrypt from 'bcryptjs';
import { IUserRepository } from '../../domain/users/user.repository.interface';
import { CreateUserInput } from '../../interfaces/validators/users/user.validator';
import { ConflictError } from '../../shared/errors/app-error';

export class CreateUserUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(input: CreateUserInput) {
    const existing = await this.userRepository.findByEmail(input.email);
    if (existing) {
      throw new ConflictError('Ya existe un usuario registrado con este correo electrónico.');
    }

    const hashedPassword = await bcrypt.hash(input.password, 10);

    return this.userRepository.create({
      email: input.email,
      fullName: input.fullName,
      password: hashedPassword,
      role: input.role || 'admin',
      isActive: input.isActive ?? true,
    });
  }
}

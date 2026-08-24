import { IUserRepository, FindAllUsersOptions } from '../../domain/users/user.repository.interface';

export class GetUsersUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(options: FindAllUsersOptions) {
    return this.userRepository.findAll(options);
  }
}

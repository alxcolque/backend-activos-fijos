import { User } from './user.entity';

export interface IAuthRepository {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  updateLastLogin(id: string): Promise<void>;
}

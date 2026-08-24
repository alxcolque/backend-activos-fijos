import { UserEntity, UserRole } from './user.entity';

export interface FindAllUsersOptions {
  page?: number;
  limit?: number;
  search?: string;
}

export interface PaginatedUsers {
  data: UserEntity[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface IUserRepository {
  findAll(options: FindAllUsersOptions): Promise<PaginatedUsers>;
  findById(id: string): Promise<UserEntity | null>;
  findByEmail(email: string): Promise<UserEntity | null>;
  create(data: { email: string; fullName: string; password: string; role?: UserRole; isActive?: boolean }): Promise<UserEntity>;
  update(id: string, data: { email?: string; fullName?: string; password?: string; role?: UserRole; isActive?: boolean }): Promise<UserEntity>;
  delete(id: string): Promise<boolean>;
  countActive(): Promise<number>;
}

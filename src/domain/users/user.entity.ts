export type UserRole = 'admin' | 'operador' | 'guest';

export interface UserEntity {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  isActive: boolean;
  lastLogin: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

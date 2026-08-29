export type UserRole = 'admin' | 'operador' | 'guest';

export interface UserEntity {
  id: string;
  email: string;
  fullName: string;
  profession?: string | null;
  projectId?: string | null;
  role: UserRole;
  isActive: boolean;
  lastLogin: Date | null;
  createdAt: Date;
  updatedAt: Date;
  project?: {
    id: string;
    name: string;
  } | null;
}

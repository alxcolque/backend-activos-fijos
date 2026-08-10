export interface User {
  id: string;
  email: string;
  password: string;
  fullName: string;
  isActive: boolean;
  lastLogin: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

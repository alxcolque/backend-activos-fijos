import { prisma } from '../database/prisma.service';
import {
  IUserRepository,
  FindAllUsersOptions,
  PaginatedUsers,
} from '../../domain/users/user.repository.interface';
import { UserEntity, UserRole } from '../../domain/users/user.entity';

export class UserRepository implements IUserRepository {
  private userSelect = {
    id: true,
    email: true,
    fullName: true,
    profession: true,
    projectId: true,
    role: true,
    isActive: true,
    lastLogin: true,
    createdAt: true,
    updatedAt: true,
    project: {
      select: {
        id: true,
        name: true,
      },
    },
  };

  async findAll(options: FindAllUsersOptions): Promise<PaginatedUsers> {
    const page = Math.max(1, Number(options.page || 1));
    const limit = Math.max(1, Math.min(100, Number(options.limit || 10)));
    const skip = (page - 1) * limit;

    const whereCondition: any = {};
    if (options.search) {
      whereCondition.OR = [
        { email: { contains: options.search } },
        { fullName: { contains: options.search } },
        { profession: { contains: options.search } },
      ];
    }

    const [total, users] = await Promise.all([
      prisma.user.count({ where: whereCondition }),
      prisma.user.findMany({
        where: whereCondition,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: this.userSelect,
      }),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      data: users as unknown as UserEntity[],
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }

  async findById(id: string): Promise<UserEntity | null> {
    const user = await prisma.user.findUnique({
      where: { id },
      select: this.userSelect,
    });
    return user as unknown as UserEntity | null;
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const user = await prisma.user.findUnique({
      where: { email },
      select: this.userSelect,
    });
    return user as unknown as UserEntity | null;
  }

  async create(data: {
    email: string;
    fullName: string;
    profession?: string | null;
    projectId?: string | null;
    password: string;
    role?: UserRole;
    isActive?: boolean;
  }): Promise<UserEntity> {
    const user = await prisma.user.create({
      data: {
        email: data.email.toLowerCase().trim(),
        fullName: data.fullName.trim(),
        profession: data.profession ? data.profession.trim() : null,
        projectId: data.projectId || null,
        password: data.password,
        role: data.role || 'admin',
        isActive: data.isActive ?? true,
      } as any,
      select: this.userSelect,
    });

    return user as unknown as UserEntity;
  }

  async update(
    id: string,
    data: {
      email?: string;
      fullName?: string;
      profession?: string | null;
      projectId?: string | null;
      password?: string;
      role?: UserRole;
      isActive?: boolean;
    }
  ): Promise<UserEntity> {
    const updateData: any = {};
    if (data.email !== undefined) updateData.email = data.email.toLowerCase().trim();
    if (data.fullName !== undefined) updateData.fullName = data.fullName.trim();
    if (data.profession !== undefined) updateData.profession = data.profession ? data.profession.trim() : null;
    if (data.projectId !== undefined) updateData.projectId = data.projectId || null;
    if (data.password !== undefined && data.password !== '') updateData.password = data.password;
    if (data.role !== undefined) updateData.role = data.role;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: this.userSelect,
    });

    return user as unknown as UserEntity;
  }

  async delete(id: string): Promise<boolean> {
    await prisma.user.delete({ where: { id } });
    return true;
  }

  async countActive(): Promise<number> {
    return prisma.user.count({ where: { isActive: true } });
  }
}

export const userRepository = new UserRepository();

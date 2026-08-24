import { FastifyRequest, FastifyReply } from 'fastify';
import { RepositoryFactory } from '../../../infrastructure/database/repository.factory';
import { GetUsersUseCase } from '../../../application/users/get-users.usecase';
import { GetUserByIdUseCase } from '../../../application/users/get-user-by-id.usecase';
import { CreateUserUseCase } from '../../../application/users/create-user.usecase';
import { UpdateUserUseCase } from '../../../application/users/update-user.usecase';
import { DeleteUserUseCase } from '../../../application/users/delete-user.usecase';
import {
  createUserSchema,
  updateUserSchema,
  queryUserSchema,
} from '../../validators/users/user.validator';
import { successResponse } from '../../../shared/utils/response.util';

const userRepository = RepositoryFactory.getUserRepository();
const getUsersUseCase = new GetUsersUseCase(userRepository);
const getUserByIdUseCase = new GetUserByIdUseCase(userRepository);
const createUserUseCase = new CreateUserUseCase(userRepository);
const updateUserUseCase = new UpdateUserUseCase(userRepository);
const deleteUserUseCase = new DeleteUserUseCase(userRepository);

export class UserController {
  public static async getUsers(request: FastifyRequest, reply: FastifyReply) {
    const validatedQuery = queryUserSchema.parse(request.query);
    const result = await getUsersUseCase.execute(validatedQuery);
    return reply.status(200).send({
      success: true,
      message: 'Lista de usuarios obtenida exitosamente.',
      data: result.data,
      pagination: result.pagination,
    });
  }

  public static async getUserById(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const user = await getUserByIdUseCase.execute(id);
    return reply.status(200).send(successResponse(user, 'Usuario obtenido exitosamente.'));
  }

  public static async createUser(request: FastifyRequest, reply: FastifyReply) {
    const validatedBody = createUserSchema.parse(request.body);
    const user = await createUserUseCase.execute(validatedBody);
    return reply.status(201).send(successResponse(user, 'Usuario creado exitosamente.'));
  }

  public static async updateUser(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const validatedBody = updateUserSchema.parse(request.body);
    const user = await updateUserUseCase.execute(id, validatedBody);
    return reply.status(200).send(successResponse(user, 'Usuario actualizado exitosamente.'));
  }

  public static async deleteUser(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const currentUserId = request.user?.id;
    const result = await deleteUserUseCase.execute(id, currentUserId);
    return reply.status(200).send(successResponse(null, result.message));
  }
}

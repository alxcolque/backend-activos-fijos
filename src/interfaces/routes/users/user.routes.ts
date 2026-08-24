import { FastifyInstance } from 'fastify';
import { UserController } from '../../controllers/users/user.controller';
import { authenticate } from '../../middlewares/auth.middleware';

export async function userRoutes(fastify: FastifyInstance): Promise<void> {
  // Aplicar autenticación JWT a todas las rutas de administración de usuarios
  fastify.addHook('onRequest', authenticate);

  fastify.get('/', UserController.getUsers);
  fastify.get('/:id', UserController.getUserById);
  fastify.post('/', UserController.createUser);
  fastify.put('/:id', UserController.updateUser);
  fastify.delete('/:id', UserController.deleteUser);
}

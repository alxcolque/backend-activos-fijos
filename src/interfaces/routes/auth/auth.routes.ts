import { FastifyInstance } from 'fastify';
import { AuthController } from '../../controllers/auth/auth.controller';
import { authenticate } from '../../middlewares/auth.middleware';

export async function authRoutes(fastify: FastifyInstance) {
  // Login
  fastify.post(
    '/login',
    {
      schema: {
        description: 'Inicio de sesión del usuario administrador',
        tags: ['Autenticación'],
        body: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email', example: 'admin@comibol.gob.bo' },
            password: { type: 'string', example: 'comibol123' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
              data: {
                type: 'object',
                properties: {
                  accessToken: { type: 'string' },
                  token: { type: 'string' },
                  refreshToken: { type: 'string' },
                  user: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      email: { type: 'string' },
                      fullName: { type: 'string' },
                      profession: { type: 'string', nullable: true },
                      role: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
          400: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
              errors: { type: 'array' },
            },
          },
        },
      },
    },
    AuthController.login,
  );

  // Perfil de Usuario (/profile y /me)
  const profileSchema = {
    description: 'Obtener datos del perfil del usuario autenticado',
    tags: ['Autenticación'],
    security: [{ bearerAuth: [] }],
    response: {
      200: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              email: { type: 'string' },
              fullName: { type: 'string' },
              profession: { type: 'string', nullable: true },
              role: { type: 'string' },
            },
          },
        },
      },
      401: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          message: { type: 'string' },
        },
      },
    },
  };

  fastify.get('/profile', { onRequest: [authenticate], schema: profileSchema }, AuthController.profile);
  fastify.get('/me', { onRequest: [authenticate], schema: profileSchema }, AuthController.profile);

  // Refresh Token
  fastify.post(
    '/refresh',
    {
      schema: {
        description: 'Renovar Access Token utilizando Refresh Token',
        tags: ['Autenticación'],
        body: {
          type: 'object',
          required: ['refreshToken'],
          properties: {
            refreshToken: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                properties: {
                  accessToken: { type: 'string' },
                },
              },
            },
          },
          401: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
    AuthController.refresh,
  );

  // Logout
  fastify.post(
    '/logout',
    {
      onRequest: [authenticate],
      schema: {
        description: 'Cerrar sesión de usuario',
        tags: ['Autenticación'],
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
    AuthController.logout,
  );
}

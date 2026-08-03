import { FastifyInstance } from 'fastify';
import { StatusController } from '../controllers/status.controller';
import { authenticate } from '../middlewares/auth.middleware';

export async function statusRoutes(fastify: FastifyInstance) {
  // Listar estados
  fastify.get(
    '/',
    {
      onRequest: [authenticate],
      schema: {
        description: 'Obtener lista de estados operativos de activos fijos',
        tags: ['Estados Operativos'],
        security: [{ bearerAuth: [] }],
        querystring: {
          type: 'object',
          properties: {
            search: { type: 'string', description: 'Filtro por nombre o descripción' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: true },
              message: { type: 'string', example: 'Estados operativos obtenidos correctamente.' },
              data: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    name: { type: 'string', example: 'Activo' },
                    description: { type: 'string', example: 'Activo operativo y en uso' },
                    totalAssets: { type: 'number', example: 980 },
                    createdAt: { type: 'string', format: 'date-time' },
                    updatedAt: { type: 'string', format: 'date-time' },
                  },
                },
              },
            },
          },
        },
      },
    },
    StatusController.getStatuses,
  );

  // Obtener por ID
  fastify.get(
    '/:id',
    {
      onRequest: [authenticate],
      schema: {
        description: 'Obtener detalle de un estado operativo por ID',
        tags: ['Estados Operativos'],
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: true },
              data: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  description: { type: 'string' },
                  totalAssets: { type: 'number' },
                  createdAt: { type: 'string', format: 'date-time' },
                  updatedAt: { type: 'string', format: 'date-time' },
                },
              },
            },
          },
          404: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: false },
              message: { type: 'string', example: 'Estado operativo no encontrado.' },
            },
          },
        },
      },
    },
    StatusController.getStatusById,
  );

  // Crear estado
  fastify.post(
    '/',
    {
      onRequest: [authenticate],
      schema: {
        description: 'Crear un nuevo estado operativo',
        tags: ['Estados Operativos'],
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          required: ['name'],
          properties: {
            name: { type: 'string', example: 'En almacén / Stock' },
            description: { type: 'string', example: 'Activo disponible en almacén' },
          },
        },
        response: {
          201: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: true },
              message: { type: 'string', example: 'Estado operativo creado exitosamente.' },
              data: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  description: { type: 'string' },
                  createdAt: { type: 'string', format: 'date-time' },
                  updatedAt: { type: 'string', format: 'date-time' },
                },
              },
            },
          },
          400: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: false },
              message: { type: 'string' },
            },
          },
        },
      },
    },
    StatusController.createStatus,
  );

  // Actualizar estado
  fastify.patch(
    '/:id',
    {
      onRequest: [authenticate],
      schema: {
        description: 'Actualizar un estado operativo existente',
        tags: ['Estados Operativos'],
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string' },
          },
        },
        body: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            description: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: true },
              message: { type: 'string', example: 'Estado operativo actualizado exitosamente.' },
              data: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  description: { type: 'string' },
                  updatedAt: { type: 'string', format: 'date-time' },
                },
              },
            },
          },
        },
      },
    },
    StatusController.updateStatus,
  );

  // Eliminar estado
  fastify.delete(
    '/:id',
    {
      onRequest: [authenticate],
      schema: {
        description: 'Eliminar un estado operativo de activo fijo',
        tags: ['Estados Operativos'],
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: true },
              message: { type: 'string', example: 'Estado operativo eliminado correctamente.' },
            },
          },
          400: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: false },
              message: { type: 'string', example: 'No se puede eliminar el estado porque tiene activos asociados.' },
            },
          },
        },
      },
    },
    StatusController.deleteStatus,
  );
}

import { FastifyInstance } from 'fastify';
import { LocationController } from '../../controllers/locations/location.controller';
import { authenticate } from '../../middlewares/auth.middleware';

export async function locationRoutes(fastify: FastifyInstance) {
  // Árbol jerárquico completo (Debe colocarse antes de /:id para evitar conflicto)
  fastify.get(
    '/tree',
    {
      onRequest: [authenticate],
      schema: {
        description: 'Obtener árbol jerárquico completo de ubicaciones',
        tags: ['Ubicaciones'],
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: true },
              message: { type: 'string', example: 'Árbol de ubicaciones obtenido correctamente.' },
              data: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    parentId: { type: 'string', nullable: true },
                    name: { type: 'string', example: 'COMIBOL' },
                    description: { type: 'string', nullable: true },
                    createdAt: { type: 'string', format: 'date-time' },
                    updatedAt: { type: 'string', format: 'date-time' },
                    children: { type: 'array' },
                  },
                },
              },
            },
          },
        },
      },
    },
    LocationController.getTree,
  );

  // Listar ubicaciones paginadas
  fastify.get(
    '/',
    {
      onRequest: [authenticate],
      schema: {
        description: 'Listar ubicaciones con búsqueda y paginación',
        tags: ['Ubicaciones'],
        security: [{ bearerAuth: [] }],
        querystring: {
          type: 'object',
          properties: {
            page: { type: 'number', default: 1 },
            limit: { type: 'number', default: 20 },
            search: { type: 'string', description: 'Filtro por nombre o descripción' },
            sortBy: { type: 'string', default: 'name' },
            sortOrder: { type: 'string', enum: ['asc', 'desc'], default: 'asc' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: true },
              message: { type: 'string' },
              data: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    parentId: { type: 'string', nullable: true },
                    name: { type: 'string' },
                    description: { type: 'string', nullable: true },
                    totalAssets: { type: 'number' },
                    totalChildren: { type: 'number' },
                    createdAt: { type: 'string', format: 'date-time' },
                    updatedAt: { type: 'string', format: 'date-time' },
                  },
                },
              },
              pagination: {
                type: 'object',
                properties: {
                  total: { type: 'number' },
                  page: { type: 'number' },
                  limit: { type: 'number' },
                  totalPages: { type: 'number' },
                },
              },
            },
          },
        },
      },
    },
    LocationController.getLocations,
  );

  // Obtener por ID
  fastify.get(
    '/:id',
    {
      onRequest: [authenticate],
      schema: {
        description: 'Obtener detalle de una ubicación por ID',
        tags: ['Ubicaciones'],
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
                  parentId: { type: 'string', nullable: true },
                  name: { type: 'string' },
                  description: { type: 'string', nullable: true },
                  totalAssets: { type: 'number' },
                  totalChildren: { type: 'number' },
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
              message: { type: 'string', example: 'Ubicación no encontrada.' },
            },
          },
        },
      },
    },
    LocationController.getLocationById,
  );

  // Crear ubicación
  fastify.post(
    '/',
    {
      onRequest: [authenticate],
      schema: {
        description: 'Crear una nueva ubicación jerárquica',
        tags: ['Ubicaciones'],
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          required: ['name'],
          properties: {
            parentId: { type: 'string', nullable: true, example: '00000000-0000-0000-0000-000000000001' },
            name: { type: 'string', example: 'Almacén Central' },
            description: { type: 'string', example: 'Ubicación principal' },
          },
        },
        response: {
          201: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: true },
              message: { type: 'string', example: 'Ubicación creada exitosamente.' },
              data: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  parentId: { type: 'string', nullable: true },
                  name: { type: 'string' },
                  description: { type: 'string', nullable: true },
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
    LocationController.createLocation,
  );

  // Actualizar ubicación (PUT)
  fastify.put(
    '/:id',
    {
      onRequest: [authenticate],
      schema: {
        description: 'Actualizar una ubicación existente (PUT)',
        tags: ['Ubicaciones'],
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
            parentId: { type: 'string', nullable: true },
            name: { type: 'string' },
            description: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: true },
              message: { type: 'string', example: 'Ubicación actualizada exitosamente.' },
              data: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  parentId: { type: 'string', nullable: true },
                  name: { type: 'string' },
                  description: { type: 'string', nullable: true },
                  updatedAt: { type: 'string', format: 'date-time' },
                },
              },
            },
          },
        },
      },
    },
    LocationController.updateLocation,
  );

  // Actualizar ubicación (PATCH)
  fastify.patch(
    '/:id',
    {
      onRequest: [authenticate],
      schema: {
        description: 'Actualizar una ubicación existente (PATCH)',
        tags: ['Ubicaciones'],
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
            parentId: { type: 'string', nullable: true },
            name: { type: 'string' },
            description: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: true },
              message: { type: 'string', example: 'Ubicación actualizada exitosamente.' },
              data: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  parentId: { type: 'string', nullable: true },
                  name: { type: 'string' },
                  description: { type: 'string', nullable: true },
                  updatedAt: { type: 'string', format: 'date-time' },
                },
              },
            },
          },
        },
      },
    },
    LocationController.updateLocation,
  );

  // Eliminar ubicación (Soft Delete)
  fastify.delete(
    '/:id',
    {
      onRequest: [authenticate],
      schema: {
        description: 'Eliminar (Soft Delete) una ubicación',
        tags: ['Ubicaciones'],
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
              message: { type: 'string', example: 'Ubicación eliminada correctamente.' },
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
    LocationController.deleteLocation,
  );
}

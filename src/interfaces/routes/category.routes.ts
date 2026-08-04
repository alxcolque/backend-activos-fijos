import { FastifyInstance } from 'fastify';
import { CategoryController } from '../controllers/category.controller';
import { authenticate } from '../middlewares/auth.middleware';

export async function categoryRoutes(fastify: FastifyInstance) {
  // Listar categorías
  fastify.get(
    '/',
    {
      onRequest: [authenticate],
      schema: {
        description: 'Obtener lista de categorías de activos fijos',
        tags: ['Categorías'],
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
              message: { type: 'string', example: 'Categorías obtenidas correctamente.' },
              data: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    name: { type: 'string', example: 'Maquinaria Pesada' },
                    description: { type: 'string', example: 'Equipos para minería' },
                    totalAssets: { type: 'number', example: 12 },
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
    CategoryController.getCategories,
  );

  // Obtener por ID
  fastify.get(
    '/:id',
    {
      onRequest: [authenticate],
      schema: {
        description: 'Obtener detalle de una categoría por ID',
        tags: ['Categorías'],
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
              message: { type: 'string', example: 'Categoría no encontrada.' },
            },
          },
        },
      },
    },
    CategoryController.getCategoryById,
  );

  // Crear categoría
  fastify.post(
    '/',
    {
      onRequest: [authenticate],
      schema: {
        description: 'Crear una nueva categoría de activo fijo',
        tags: ['Categorías'],
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          required: ['name'],
          properties: {
            name: { type: 'string', example: 'Equipos de Computación' },
            description: { type: 'string', example: 'Servidores y laps' },
          },
        },
        response: {
          201: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: true },
              message: { type: 'string', example: 'Categoría creada exitosamente.' },
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
    CategoryController.createCategory,
  );

  // Actualizar categoría (soporta tanto PUT como PATCH)
  const updateSchema = {
    onRequest: [authenticate],
    schema: {
      description: 'Actualizar una categoría existente',
      tags: ['Categorías'],
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
            message: { type: 'string', example: 'Categoría actualizada exitosamente.' },
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
  };

  fastify.put('/:id', updateSchema, CategoryController.updateCategory);
  fastify.patch('/:id', updateSchema, CategoryController.updateCategory);

  // Eliminar categoría
  fastify.delete(
    '/:id',
    {
      onRequest: [authenticate],
      schema: {
        description: 'Eliminar una categoría de activo fijo',
        tags: ['Categorías'],
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
              message: { type: 'string', example: 'Categoría eliminada correctamente.' },
            },
          },
          400: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: false },
              message: { type: 'string', example: 'No se puede eliminar la categoría porque tiene activos asociados.' },
            },
          },
        },
      },
    },
    CategoryController.deleteCategory,
  );
}

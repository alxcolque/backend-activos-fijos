import { FastifyInstance } from 'fastify';
import { AssetController } from '../../controllers/assets/asset.controller';
import { authenticate } from '../../middlewares/auth.middleware';

export async function assetRoutes(fastify: FastifyInstance) {
  // Obtener por Código
  fastify.get(
    '/code/:code',
    {
      onRequest: [authenticate],
      schema: {
        description: 'Obtener detalle de un activo por su código patrimonial',
        tags: ['Activos Fijos'],
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['code'],
          properties: {
            code: { type: 'string', example: 'COM-MP-001' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: true },
              data: { type: 'object' },
            },
          },
          404: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: false },
              message: { type: 'string', example: 'Activo no encontrado.' },
            },
          },
        },
      },
    },
    AssetController.getAssetByCode,
  );

  // Obtener por QR
  fastify.get(
    '/qr/:qrCode',
    {
      onRequest: [authenticate],
      schema: {
        description: 'Obtener detalle de un activo mediante lectura de código QR',
        tags: ['Activos Fijos'],
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['qrCode'],
          properties: {
            qrCode: { type: 'string', example: 'COM-MP-001' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: true },
              data: { type: 'object' },
            },
          },
          404: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: false },
              message: { type: 'string', example: 'Activo no encontrado mediante código QR.' },
            },
          },
        },
      },
    },
    AssetController.getAssetByQr,
  );

  // Listar activos paginados
  fastify.get(
    '/',
    {
      onRequest: [authenticate],
      schema: {
        description: 'Listar activos fijos con búsqueda, filtros y paginación',
        tags: ['Activos Fijos'],
        security: [{ bearerAuth: [] }],
        querystring: {
          type: 'object',
          properties: {
            page: { type: 'number', default: 1 },
            limit: { type: 'number', default: 20 },
            search: { type: 'string', description: 'Filtro por código, nombre, descripción, marca, modelo o serie' },
            category: { type: 'string', description: 'ID de la categoría' },
            status: { type: 'string', description: 'ID del estado' },
            location: { type: 'string', description: 'ID de la ubicación' },
            sortBy: {
              type: 'string',
              enum: ['code', 'name', 'purchaseDate', 'purchaseValue', 'createdAt'],
              default: 'name',
            },
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
                    code: { type: 'string' },
                    qrCode: { type: 'string', nullable: true },
                    name: { type: 'string' },
                    category: { type: 'object' },
                    status: { type: 'object' },
                    location: { type: 'object' },
                    brand: { type: 'string', nullable: true },
                    model: { type: 'string', nullable: true },
                    serialNumber: { type: 'string', nullable: true },
                    purchaseValue: { type: 'number', nullable: true },
                    currentValue: { type: 'number', nullable: true },
                    createdAt: { type: 'string', format: 'date-time' },
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
    AssetController.getAssets,
  );

  // Obtener por ID
  fastify.get(
    '/:id',
    {
      onRequest: [authenticate],
      schema: {
        description: 'Obtener detalle completo de un activo fijo por ID',
        tags: ['Activos Fijos'],
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
              data: { type: 'object' },
            },
          },
          404: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: false },
              message: { type: 'string', example: 'Activo no encontrado.' },
            },
          },
        },
      },
    },
    AssetController.getAssetById,
  );

  // Crear activo
  fastify.post(
    '/',
    {
      onRequest: [authenticate],
      schema: {
        description: 'Crear un nuevo activo fijo patrimonial',
        tags: ['Activos Fijos'],
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          required: [
            'code',
            'name',
            'categoryId',
            'statusId',
            'locationId',
            'quantity',
            'purchaseValue',
            'usefulLife',
          ],
          properties: {
            code: { type: 'string', example: 'AF-000001' },
            name: { type: 'string', example: 'Compresora Atlas Copco' },
            description: { type: 'string', nullable: true },
            categoryId: { type: 'string', example: 'uuid' },
            statusId: { type: 'string', example: 'uuid' },
            locationId: { type: 'string', example: 'uuid' },
            brand: { type: 'string', nullable: true, example: 'Atlas Copco' },
            model: { type: 'string', nullable: true, example: 'GA90' },
            serialNumber: { type: 'string', nullable: true, example: '123456' },
            unit: { type: 'string', default: 'PZA' },
            quantity: { type: 'number', example: 1 },
            purchaseDate: { type: 'string', format: 'date', nullable: true, example: '2025-01-10' },
            purchaseYear: { type: 'number', nullable: true, example: 2025 },
            purchaseValue: { type: 'number', example: 350000 },
            usefulLife: { type: 'number', example: 10 },
            residualValue: { type: 'number', nullable: true, example: 35000 },
            currentValue: { type: 'number', nullable: true, example: 350000 },
            observations: { type: 'string', nullable: true },
            photo: { type: 'string', nullable: true },
          },
        },
        response: {
          201: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: true },
              message: { type: 'string', example: 'Activo fijo creado exitosamente.' },
              data: { type: 'object' },
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
    AssetController.createAsset,
  );

  // Actualizar activo (PUT)
  fastify.put(
    '/:id',
    {
      onRequest: [authenticate],
      schema: {
        description: 'Actualizar un activo fijo existente (PUT)',
        tags: ['Activos Fijos'],
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string' },
          },
        },
        body: { type: 'object' },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: true },
              message: { type: 'string', example: 'Activo fijo actualizado exitosamente.' },
              data: { type: 'object' },
            },
          },
        },
      },
    },
    AssetController.updateAsset,
  );

  // Actualizar activo (PATCH)
  fastify.patch(
    '/:id',
    {
      onRequest: [authenticate],
      schema: {
        description: 'Actualizar un activo fijo existente (PATCH)',
        tags: ['Activos Fijos'],
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string' },
          },
        },
        body: { type: 'object' },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: true },
              message: { type: 'string', example: 'Activo fijo actualizado exitosamente.' },
              data: { type: 'object' },
            },
          },
        },
      },
    },
    AssetController.updateAsset,
  );

  // Eliminar activo (Soft Delete)
  fastify.delete(
    '/:id',
    {
      onRequest: [authenticate],
      schema: {
        description: 'Eliminar (Soft Delete) un activo fijo sin registros vinculados',
        tags: ['Activos Fijos'],
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
              message: { type: 'string', example: 'Activo eliminado correctamente.' },
            },
          },
          400: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: false },
              message: { type: 'string', example: 'No es posible eliminar el activo porque tiene información relacionada.' },
            },
          },
        },
      },
    },
    AssetController.deleteAsset,
  );
}

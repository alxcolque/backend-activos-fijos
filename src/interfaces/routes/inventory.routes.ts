import { FastifyInstance } from 'fastify';
import { InventoryController } from '../controllers/inventory.controller';
import { authenticate } from '../middlewares/auth.middleware';

export async function inventoryRoutes(fastify: FastifyInstance) {
  // Crear campaña de inventario
  fastify.post(
    '/',
    {
      onRequest: [authenticate],
      schema: {
        description: 'Crear una nueva campaña de inventario físico por ubicación',
        tags: ['Inventarios Físicos'],
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          required: ['name', 'inventoryDate', 'locationId'],
          properties: {
            name: { type: 'string', example: 'Inventario Anual 2026 - San José' },
            inventoryDate: { type: 'string', format: 'date', example: '2026-08-02' },
            locationId: { type: 'string', example: 'uuid-ubicacion' },
            observations: { type: 'string', nullable: true, example: 'Inspección física general' },
          },
        },
        response: {
          201: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: true },
              message: { type: 'string', example: 'Campaña de inventario creada exitosamente.' },
              data: { type: 'object', additionalProperties: true },
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
    InventoryController.createInventory,
  );

  // Conciliar ítem en inventario
  fastify.post(
    '/:id/items',
    {
      onRequest: [authenticate],
      schema: {
        description: 'Registrar o conciliar la verificación física de un activo en la campaña',
        tags: ['Inventarios Físicos'],
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
          required: ['assetId'],
          properties: {
            assetId: { type: 'string', example: 'uuid-activo' },
            status: { type: 'string', enum: ['FOUND', 'NOT_FOUND', 'DAMAGED'], default: 'FOUND' },
            observations: { type: 'string', nullable: true, example: 'Verificado en oficina' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: true },
              message: { type: 'string', example: 'Ítem de inventario registrado correctamente.' },
              data: { type: 'object', additionalProperties: true },
            },
          },
        },
      },
    },
    InventoryController.registerItem,
  );

  // Obtener ítems de una campaña de inventario
  fastify.get(
    '/:id/items',
    {
      onRequest: [authenticate],
      schema: {
        description: 'Obtener los ítems inspeccionados y su estado en una campaña de inventario',
        tags: ['Inventarios Físicos'],
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
              data: { type: 'array', items: { type: 'object' } },
            },
          },
        },
      },
    },
    InventoryController.getInventoryItems,
  );

  // Obtener detalle de campaña por ID
  fastify.get(
    '/:id',
    {
      onRequest: [authenticate],
      schema: {
        description: 'Obtener detalle de una campaña de inventario con estadísticas de conciliación',
        tags: ['Inventarios Físicos'],
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
              data: { type: 'object', additionalProperties: true },
            },
          },
          404: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: false },
              message: { type: 'string', example: 'Campaña de inventario no encontrada.' },
            },
          },
        },
      },
    },
    InventoryController.getInventoryById,
  );

  // Eliminar campaña de inventario
  fastify.delete(
    '/:id',
    {
      onRequest: [authenticate],
      schema: {
        description: 'Eliminar una campaña de inventario físico',
        tags: ['Inventarios Físicos'],
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
              message: { type: 'string', example: 'Campaña de inventario eliminada correctamente.' },
            },
          },
        },
      },
    },
    InventoryController.deleteInventory,
  );

  // Listar todas las campañas
  fastify.get(
    '/',
    {
      onRequest: [authenticate],
      schema: {
        description: 'Listar campañas de inventario físico con búsqueda y paginación',
        tags: ['Inventarios Físicos'],
        security: [{ bearerAuth: [] }],
        querystring: {
          type: 'object',
          properties: {
            page: { type: 'number', default: 1 },
            limit: { type: 'number', default: 20 },
            search: { type: 'string', description: 'Filtro por nombre o ubicación' },
            locationId: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: true },
              message: { type: 'string' },
              data: { type: 'array', items: { type: 'object' } },
              pagination: { type: 'object' },
            },
          },
        },
      },
    },
    InventoryController.getAllInventories,
  );
}

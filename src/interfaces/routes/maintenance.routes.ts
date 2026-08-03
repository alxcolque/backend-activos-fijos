import { FastifyInstance } from 'fastify';
import { MaintenanceController } from '../controllers/maintenance.controller';
import { authenticate } from '../middlewares/auth.middleware';

export async function maintenanceRoutes(fastify: FastifyInstance) {
  // Registrar mantenimiento
  fastify.post(
    '/',
    {
      onRequest: [authenticate],
      schema: {
        description: 'Registrar una intervención de mantenimiento preventivo o correctivo',
        tags: ['Control de Mantenimiento'],
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          required: ['assetId', 'maintenanceDate'],
          properties: {
            assetId: { type: 'string', example: 'uuid-activo' },
            type: { type: 'string', enum: ['PREVENTIVE', 'CORRECTIVE'], default: 'PREVENTIVE' },
            maintenanceDate: { type: 'string', format: 'date', example: '2026-08-01' },
            provider: { type: 'string', nullable: true, example: 'SOPORTE TECNICO ATLAS COPCO S.A.' },
            cost: { type: 'number', nullable: true, example: 1500.5 },
            nextMaintenance: { type: 'string', format: 'date', nullable: true, example: '2027-02-01' },
            observations: { type: 'string', nullable: true, example: 'Cambio de aceite y filtros' },
          },
        },
        response: {
          201: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: true },
              message: { type: 'string', example: 'Mantenimiento registrado exitosamente.' },
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
    MaintenanceController.createMaintenance,
  );

  // Obtener mantenimientos de un activo (Debe colocarse antes de /:id)
  fastify.get(
    '/asset/:assetId',
    {
      onRequest: [authenticate],
      schema: {
        description: 'Obtener el historial de mantenimientos de un activo fijo',
        tags: ['Control de Mantenimiento'],
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['assetId'],
          properties: {
            assetId: { type: 'string' },
          },
        },
        querystring: {
          type: 'object',
          properties: {
            type: { type: 'string', enum: ['PREVENTIVE', 'CORRECTIVE'] },
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
    MaintenanceController.getAssetMaintenances,
  );

  // Obtener detalle por ID
  fastify.get(
    '/:id',
    {
      onRequest: [authenticate],
      schema: {
        description: 'Obtener detalle de un registro de mantenimiento por ID',
        tags: ['Control de Mantenimiento'],
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
              message: { type: 'string', example: 'Registro de mantenimiento no encontrado.' },
            },
          },
        },
      },
    },
    MaintenanceController.getMaintenanceById,
  );

  // Actualizar mantenimiento (PATCH)
  fastify.patch(
    '/:id',
    {
      onRequest: [authenticate],
      schema: {
        description: 'Actualizar un registro de mantenimiento (PATCH)',
        tags: ['Control de Mantenimiento'],
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
              message: { type: 'string', example: 'Mantenimiento actualizado exitosamente.' },
              data: { type: 'object' },
            },
          },
        },
      },
    },
    MaintenanceController.updateMaintenance,
  );

  // Actualizar mantenimiento (PUT)
  fastify.put(
    '/:id',
    {
      onRequest: [authenticate],
      schema: {
        description: 'Actualizar un registro de mantenimiento (PUT)',
        tags: ['Control de Mantenimiento'],
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
              message: { type: 'string', example: 'Mantenimiento actualizado exitosamente.' },
              data: { type: 'object' },
            },
          },
        },
      },
    },
    MaintenanceController.updateMaintenance,
  );

  // Eliminar registro de mantenimiento
  fastify.delete(
    '/:id',
    {
      onRequest: [authenticate],
      schema: {
        description: 'Eliminar un registro de mantenimiento',
        tags: ['Control de Mantenimiento'],
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
              message: { type: 'string', example: 'Mantenimiento eliminado correctamente.' },
            },
          },
        },
      },
    },
    MaintenanceController.deleteMaintenance,
  );

  // Listar todos los mantenimientos
  fastify.get(
    '/',
    {
      onRequest: [authenticate],
      schema: {
        description: 'Listar registros de mantenimiento con búsqueda y paginación',
        tags: ['Control de Mantenimiento'],
        security: [{ bearerAuth: [] }],
        querystring: {
          type: 'object',
          properties: {
            page: { type: 'number', default: 1 },
            limit: { type: 'number', default: 20 },
            search: { type: 'string', description: 'Filtro por proveedor, observaciones o código/nombre del activo' },
            type: { type: 'string', enum: ['PREVENTIVE', 'CORRECTIVE'] },
            assetId: { type: 'string' },
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
    MaintenanceController.getAllMaintenances,
  );
}

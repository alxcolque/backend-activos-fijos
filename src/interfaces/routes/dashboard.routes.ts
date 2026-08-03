import { FastifyInstance } from 'fastify';
import { DashboardController } from '../controllers/dashboard.controller';
import { authenticate } from '../middlewares/auth.middleware';

export async function dashboardRoutes(fastify: FastifyInstance) {
  fastify.get(
    '/',
    {
      onRequest: [authenticate],
      schema: {
        description: 'Obtener resumen general y estadísticas del Dashboard de Activos Fijos',
        tags: ['Dashboard'],
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: true },
              message: { type: 'string', example: 'Dashboard obtenido correctamente.' },
              data: {
                type: 'object',
                properties: {
                  summary: {
                    type: 'object',
                    properties: {
                      totalAssets: { type: 'number', example: 1250 },
                      totalValue: { type: 'number', example: 45000000 },
                      operationalAssets: { type: 'number', example: 980 },
                      maintenanceAssets: { type: 'number', example: 120 },
                      inactiveAssets: { type: 'number', example: 50 },
                    },
                  },
                  byStatus: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        status: { type: 'string', example: 'Activo' },
                        count: { type: 'number', example: 850 },
                      },
                    },
                  },
                  byCategory: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        category: { type: 'string', example: 'Maquinaria Pesada' },
                        quantity: { type: 'number', example: 300 },
                        value: { type: 'number', example: 35000000 },
                      },
                    },
                  },
                  byLocation: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        location: { type: 'string', example: 'Huanuni' },
                        quantity: { type: 'number', example: 400 },
                      },
                    },
                  },
                  recentAssets: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        code: { type: 'string', example: 'COM-MP-001' },
                        name: { type: 'string', example: 'Volquete Caterpillar' },
                        createdAt: { type: 'string', format: 'date-time' },
                      },
                    },
                  },
                  recentActivities: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        action: { type: 'string', example: 'CREATE' },
                        description: { type: 'string', example: 'Nuevo activo registrado' },
                        date: { type: 'string', format: 'date-time' },
                      },
                    },
                  },
                },
              },
            },
          },
          401: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: false },
              message: { type: 'string', example: 'Token de acceso no proporcionado' },
            },
          },
        },
      },
    },
    DashboardController.getDashboard,
  );
}

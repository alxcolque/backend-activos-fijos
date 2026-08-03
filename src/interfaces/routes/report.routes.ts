import { FastifyInstance } from 'fastify';
import { ReportController } from '../controllers/report.controller';
import { authenticate } from '../middlewares/auth.middleware';

export async function reportRoutes(fastify: FastifyInstance) {
  // Reporte de activos fijos
  fastify.get(
    '/assets',
    {
      onRequest: [authenticate],
      schema: {
        description: 'Generar reporte consolidado de inventario de activos fijos',
        tags: ['Generación de Reportes'],
        security: [{ bearerAuth: [] }],
        querystring: {
          type: 'object',
          properties: {
            category: { type: 'string' },
            status: { type: 'string' },
            location: { type: 'string' },
            startDate: { type: 'string', format: 'date' },
            endDate: { type: 'string', format: 'date' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: true },
              message: { type: 'string' },
              data: { type: 'object' },
            },
          },
        },
      },
    },
    ReportController.getAssetsReport,
  );

  // Reporte de depreciación contable
  fastify.get(
    '/depreciation',
    {
      onRequest: [authenticate],
      schema: {
        description: 'Generar reporte de depreciación lineal acumulada de activos fijos',
        tags: ['Generación de Reportes'],
        security: [{ bearerAuth: [] }],
        querystring: {
          type: 'object',
          properties: {
            category: { type: 'string' },
            year: { type: 'number', example: 2026 },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: true },
              message: { type: 'string' },
              data: { type: 'object' },
            },
          },
        },
      },
    },
    ReportController.getDepreciationReport,
  );

  // Reporte de asignaciones
  fastify.get(
    '/assignments',
    {
      onRequest: [authenticate],
      schema: {
        description: 'Generar reporte de asignaciones y custodias de activos',
        tags: ['Generación de Reportes'],
        security: [{ bearerAuth: [] }],
        querystring: {
          type: 'object',
          properties: {
            projectId: { type: 'string' },
            activeOnly: { type: 'string', example: 'true' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: true },
              message: { type: 'string' },
              data: { type: 'object' },
            },
          },
        },
      },
    },
    ReportController.getAssignmentsReport,
  );

  // Reporte de mantenimientos
  fastify.get(
    '/maintenances',
    {
      onRequest: [authenticate],
      schema: {
        description: 'Generar reporte de costos e intervenciones de mantenimiento',
        tags: ['Generación de Reportes'],
        security: [{ bearerAuth: [] }],
        querystring: {
          type: 'object',
          properties: {
            type: { type: 'string', enum: ['PREVENTIVE', 'CORRECTIVE'] },
            startDate: { type: 'string', format: 'date' },
            endDate: { type: 'string', format: 'date' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: true },
              message: { type: 'string' },
              data: { type: 'object' },
            },
          },
        },
      },
    },
    ReportController.getMaintenancesReport,
  );
}

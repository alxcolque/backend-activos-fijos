import { FastifyInstance } from 'fastify';
import { AssignmentController } from '../controllers/assignment.controller';
import { authenticate } from '../middlewares/auth.middleware';

export async function assignmentRoutes(fastify: FastifyInstance) {
  // Asignar custodio a activo
  fastify.post(
    '/assign',
    {
      onRequest: [authenticate],
      schema: {
        description: 'Asignar la custodia de un activo a un funcionario responsable',
        tags: ['Asignaciones a Custodios'],
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          required: ['assetId', 'responsibleName'],
          properties: {
            assetId: { type: 'string', example: 'uuid-activo' },
            responsibleName: { type: 'string', example: 'Ing. Carlos Mendoza' },
            position: { type: 'string', example: 'Jefe de Operaciones Minas' },
            observations: { type: 'string', example: 'Entrega para supervisión técnica' },
          },
        },
        response: {
          201: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: true },
              message: { type: 'string', example: 'Activo asignado al custodio exitosamente.' },
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
    AssignmentController.assignCustodian,
  );

  // Registrar devolución de activo
  fastify.post(
    '/return',
    {
      onRequest: [authenticate],
      schema: {
        description: 'Registrar la devolución de custodia de un activo',
        tags: ['Asignaciones a Custodios'],
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          required: ['assetId'],
          properties: {
            assetId: { type: 'string', example: 'uuid-activo' },
            observations: { type: 'string', example: 'Devolución por rotación de personal' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: true },
              message: { type: 'string', example: 'Devolución de activo registrada correctamente.' },
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
    AssignmentController.returnAsset,
  );

  // Obtener historial de custodios de un activo (Debe colocarse antes de /:id)
  fastify.get(
    '/asset/:assetId',
    {
      onRequest: [authenticate],
      schema: {
        description: 'Obtener el historial completo de custodios de un activo',
        tags: ['Asignaciones a Custodios'],
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['assetId'],
          properties: {
            assetId: { type: 'string' },
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
    AssignmentController.getAssetCustodians,
  );

  // Obtener detalle de asignación por ID
  fastify.get(
    '/:id',
    {
      onRequest: [authenticate],
      schema: {
        description: 'Obtener detalle de un registro de asignación a custodio por ID',
        tags: ['Asignaciones a Custodios'],
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
              message: { type: 'string', example: 'Registro de asignación no encontrado.' },
            },
          },
        },
      },
    },
    AssignmentController.getAssignmentById,
  );

  // Listar todas las asignaciones a custodios
  fastify.get(
    '/',
    {
      onRequest: [authenticate],
      schema: {
        description: 'Listar historial de asignaciones a custodios con búsqueda y paginación',
        tags: ['Asignaciones a Custodios'],
        security: [{ bearerAuth: [] }],
        querystring: {
          type: 'object',
          properties: {
            page: { type: 'number', default: 1 },
            limit: { type: 'number', default: 20 },
            search: { type: 'string', description: 'Filtro por responsable, cargo u observaciones' },
            assetId: { type: 'string' },
            activeOnly: { type: 'string', example: 'true' },
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
    AssignmentController.getAllAssignments,
  );
}

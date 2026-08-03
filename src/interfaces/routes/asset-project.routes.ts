import { FastifyInstance } from 'fastify';
import { AssetProjectController } from '../controllers/asset-project.controller';
import { authenticate } from '../middlewares/auth.middleware';

export async function assetProjectRoutes(fastify: FastifyInstance) {
  // Asignar activo a proyecto
  fastify.post(
    '/assign',
    {
      onRequest: [authenticate],
      schema: {
        description: 'Asignar un activo fijo a un proyecto activo',
        tags: ['Asignación Activos-Proyectos'],
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          required: ['assetId', 'projectId'],
          properties: {
            assetId: { type: 'string', example: 'uuid-activo' },
            projectId: { type: 'string', example: 'uuid-proyecto' },
            observations: { type: 'string', example: 'Asignado para operación en mina' },
          },
        },
        response: {
          201: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: true },
              message: { type: 'string', example: 'Activo asignado al proyecto exitosamente.' },
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
    AssetProjectController.assignAsset,
  );

  // Liberar activo de proyecto
  fastify.post(
    '/release',
    {
      onRequest: [authenticate],
      schema: {
        description: 'Liberar/Devolver un activo asignado a un proyecto',
        tags: ['Asignación Activos-Proyectos'],
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          required: ['assetId', 'projectId'],
          properties: {
            assetId: { type: 'string', example: 'uuid-activo' },
            projectId: { type: 'string', example: 'uuid-proyecto' },
            observations: { type: 'string', example: 'Devolución por fin de campaña' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: true },
              message: { type: 'string', example: 'Activo liberado del proyecto exitosamente.' },
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
    AssetProjectController.releaseAsset,
  );

  // Obtener activos de un proyecto
  fastify.get(
    '/project/:projectId',
    {
      onRequest: [authenticate],
      schema: {
        description: 'Obtener la lista de activos asociados a un proyecto',
        tags: ['Asignación Activos-Proyectos'],
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['projectId'],
          properties: {
            projectId: { type: 'string' },
          },
        },
        querystring: {
          type: 'object',
          properties: {
            activeOnly: { type: 'string', example: 'true' },
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
    AssetProjectController.getProjectAssets,
  );

  // Obtener historial de proyectos de un activo
  fastify.get(
    '/asset/:assetId',
    {
      onRequest: [authenticate],
      schema: {
        description: 'Obtener el historial de proyectos a los que ha pertenecido un activo',
        tags: ['Asignación Activos-Proyectos'],
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
    AssetProjectController.getAssetHistory,
  );

  // Listar todas las asignaciones
  fastify.get(
    '/',
    {
      onRequest: [authenticate],
      schema: {
        description: 'Listar todas las asignaciones activo-proyecto con filtros y paginación',
        tags: ['Asignación Activos-Proyectos'],
        security: [{ bearerAuth: [] }],
        querystring: {
          type: 'object',
          properties: {
            page: { type: 'number', default: 1 },
            limit: { type: 'number', default: 20 },
            projectId: { type: 'string' },
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
    AssetProjectController.getAllAssignments,
  );
}

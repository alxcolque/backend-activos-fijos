import { FastifyInstance } from 'fastify';
import { ProjectController } from '../../controllers/projects/project.controller';
import { authenticate } from '../../middlewares/auth.middleware';

export async function projectRoutes(fastify: FastifyInstance) {
  // Listar proyectos
  fastify.get(
    '/',
    {
      onRequest: [authenticate],
      schema: {
        description: 'Listar proyectos mineros e institucionales con búsqueda, filtros y paginación',
        tags: ['Proyectos'],
        security: [{ bearerAuth: [] }],
        querystring: {
          type: 'object',
          properties: {
            page: { type: 'number', default: 1 },
            limit: { type: 'number', default: 20 },
            search: { type: 'string', description: 'Filtro por nombre, dirección, responsable o descripción' },
            status: {
              type: 'string',
              enum: ['ACTIVE', 'FINISHED', 'SUSPENDED', 'CANCELLED'],
              description: 'Estado del proyecto',
            },
            sortBy: { type: 'string', enum: ['name', 'startDate', 'createdAt'], default: 'name' },
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
                    name: { type: 'string', example: 'Proyecto Mesa Verde' },
                    address: { type: 'string', nullable: true, example: 'Av. 6 de Octubre #1234' },
                    responsible: { type: 'string', nullable: true, example: 'Ing. Juan Pérez' },
                    status: { type: 'string', example: 'ACTIVE' },
                    startDate: { type: 'string', format: 'date-time', nullable: true },
                    endDate: { type: 'string', format: 'date-time', nullable: true },
                    description: { type: 'string', nullable: true },
                    totalAssets: { type: 'number' },
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
    ProjectController.getProjects,
  );

  // Obtener por ID
  fastify.get(
    '/:id',
    {
      onRequest: [authenticate],
      schema: {
        description: 'Obtener detalle de un proyecto por ID',
        tags: ['Proyectos'],
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
                  address: { type: 'string', nullable: true },
                  responsible: { type: 'string', nullable: true },
                  status: { type: 'string' },
                  startDate: { type: 'string', format: 'date-time', nullable: true },
                  endDate: { type: 'string', format: 'date-time', nullable: true },
                  description: { type: 'string', nullable: true },
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
              message: { type: 'string', example: 'Proyecto no encontrado.' },
            },
          },
        },
      },
    },
    ProjectController.getProjectById,
  );

  // Crear proyecto
  fastify.post(
    '/',
    {
      onRequest: [authenticate],
      schema: {
        description: 'Crear un nuevo proyecto minero e institucional',
        tags: ['Proyectos'],
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          required: ['name'],
          properties: {
            name: { type: 'string', example: 'Proyecto Mesa Verde' },
            address: { type: 'string', nullable: true, example: 'Av. 6 de Octubre #1234' },
            responsible: { type: 'string', nullable: true, example: 'Ing. Juan Pérez' },
            status: { type: 'string', enum: ['ACTIVE', 'FINISHED', 'SUSPENDED', 'CANCELLED'], default: 'ACTIVE' },
            startDate: { type: 'string', format: 'date', nullable: true, example: '2026-01-01' },
            endDate: { type: 'string', format: 'date', nullable: true },
            description: { type: 'string', nullable: true, example: 'Proyecto minero' },
          },
        },
        response: {
          201: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: true },
              message: { type: 'string', example: 'Proyecto creado exitosamente.' },
              data: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  address: { type: 'string', nullable: true },
                  responsible: { type: 'string', nullable: true },
                  status: { type: 'string' },
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
    ProjectController.createProject,
  );

  // Actualizar proyecto (PUT & PATCH)
  const updateSchema = {
    onRequest: [authenticate],
    schema: {
      description: 'Actualizar un proyecto existente',
      tags: ['Proyectos'],
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
          address: { type: 'string', nullable: true },
          responsible: { type: 'string', nullable: true },
          status: { type: 'string', enum: ['ACTIVE', 'FINISHED', 'SUSPENDED', 'CANCELLED'] },
          startDate: { type: 'string', format: 'date', nullable: true },
          endDate: { type: 'string', format: 'date', nullable: true },
          description: { type: 'string', nullable: true },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Proyecto actualizado exitosamente.' },
            data: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                updatedAt: { type: 'string', format: 'date-time' },
              },
            },
          },
        },
      },
    },
  };

  fastify.put('/:id', updateSchema, ProjectController.updateProject);
  fastify.patch('/:id', updateSchema, ProjectController.updateProject);

  // Eliminar proyecto (Soft Delete)
  fastify.delete(
    '/:id',
    {
      onRequest: [authenticate],
      schema: {
        description: 'Eliminar (Soft Delete) un proyecto sin activos asociados',
        tags: ['Proyectos'],
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
              message: { type: 'string', example: 'Proyecto eliminado correctamente.' },
            },
          },
          400: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: false },
              message: { type: 'string', example: 'No es posible eliminar un proyecto con activos asociados.' },
            },
          },
        },
      },
    },
    ProjectController.deleteProject,
  );
}

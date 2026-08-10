import { FastifyRequest, FastifyReply } from 'fastify';
import { RepositoryFactory } from '../../../infrastructure/database/repository.factory';
import { GetProjectsUseCase } from '../../../application/projects/getAll/get-projects.usecase';
import { GetProjectUseCase } from '../../../application/projects/get/get-project.usecase';
import { CreateProjectUseCase } from '../../../application/projects/create/create-project.usecase';
import { UpdateProjectUseCase } from '../../../application/projects/update/update-project.usecase';
import { DeleteProjectUseCase } from '../../../application/projects/delete/delete-project.usecase';
import {
  createProjectSchema,
  updateProjectSchema,
  queryProjectSchema,
} from '../../validators/projects/project.validator';
import { successResponse } from '../../../shared/utils/response.util';

const projectRepository = RepositoryFactory.getProjectRepository();
const getProjectsUseCase = new GetProjectsUseCase(projectRepository);
const getProjectUseCase = new GetProjectUseCase(projectRepository);
const createProjectUseCase = new CreateProjectUseCase(projectRepository);
const updateProjectUseCase = new UpdateProjectUseCase(projectRepository);
const deleteProjectUseCase = new DeleteProjectUseCase(projectRepository);

export class ProjectController {
  public static async getProjects(request: FastifyRequest, reply: FastifyReply) {
    const validatedQuery = queryProjectSchema.parse(request.query);
    const result = await getProjectsUseCase.execute(validatedQuery);
    return reply.status(200).send({
      success: true,
      message: 'Proyectos obtenidos correctamente.',
      data: result.data,
      pagination: result.pagination,
    });
  }

  public static async getProjectById(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const project = await getProjectUseCase.execute(id);
    return reply.status(200).send(successResponse(project));
  }

  public static async createProject(request: FastifyRequest, reply: FastifyReply) {
    const validatedBody = createProjectSchema.parse(request.body);
    const project = await createProjectUseCase.execute(validatedBody);
    return reply.status(201).send(successResponse(project, 'Proyecto creado exitosamente.'));
  }

  public static async updateProject(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const validatedBody = updateProjectSchema.parse(request.body);
    const project = await updateProjectUseCase.execute(id, validatedBody);
    return reply.status(200).send(successResponse(project, 'Proyecto actualizado exitosamente.'));
  }

  public static async deleteProject(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const result = await deleteProjectUseCase.execute(id);
    return reply.status(200).send(successResponse(null, result.message));
  }
}

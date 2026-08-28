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

import { generateProjectWordReport } from '../../../shared/utils/project-word-report.util';
import { NotFoundError } from '../../../shared/errors/app-error';

const projectRepository = RepositoryFactory.getProjectRepository();
const assetProjectRepository = RepositoryFactory.getAssetProjectRepository();
const supplyProjectRepository = RepositoryFactory.getSupplyProjectRepository();
const assetRepository = RepositoryFactory.getAssetRepository();
const getProjectsUseCase = new GetProjectsUseCase(projectRepository);
const getProjectUseCase = new GetProjectUseCase(projectRepository);
const createProjectUseCase = new CreateProjectUseCase(projectRepository, assetProjectRepository, assetRepository);
const updateProjectUseCase = new UpdateProjectUseCase(projectRepository, assetProjectRepository, assetRepository);
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

  public static async downloadWordReport(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const query = (request.query as { pageSize?: string; orientation?: string }) || {};
    const body = (request.body as { pageSize?: string; orientation?: string }) || {};

    const pageSize = (query.pageSize || body.pageSize || 'carta') as 'carta' | 'a4' | 'oficio';
    const orientation = (query.orientation || body.orientation || 'horizontal') as 'vertical' | 'horizontal';

    const project = await getProjectUseCase.execute(id);
    if (!project) {
      throw new NotFoundError('Proyecto no encontrado.');
    }

    const assignments = await assetProjectRepository.findByProjectId(id, false);
    const supplyAssignments = await supplyProjectRepository.findByProjectId(id);

    const wordBuffer = await generateProjectWordReport(project, assignments, supplyAssignments, { pageSize, orientation });

    const safeName = project.name.replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `Informe_Inventario_${safeName}.docx`;

    return reply
      .header('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
      .header('Content-Disposition', `attachment; filename="${filename}"`)
      .send(wordBuffer);
  }
}

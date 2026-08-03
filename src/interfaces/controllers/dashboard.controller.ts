import { FastifyRequest, FastifyReply } from 'fastify';
import { DashboardRepository } from '../../infrastructure/repositories/dashboard.repository';
import { GetDashboardUseCase } from '../../application/dashboard/get-dashboard/get-dashboard.usecase';
import { successResponse } from '../../shared/utils/response.util';

const dashboardRepository = new DashboardRepository();
const getDashboardUseCase = new GetDashboardUseCase(dashboardRepository);

export class DashboardController {
  public static async getDashboard(_request: FastifyRequest, reply: FastifyReply) {
    const data = await getDashboardUseCase.execute();
    return reply.status(200).send(successResponse(data, 'Dashboard obtenido correctamente.'));
  }
}

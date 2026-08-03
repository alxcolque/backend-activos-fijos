import { FastifyRequest, FastifyReply } from 'fastify';
import { ReportRepository } from '../../infrastructure/repositories/report.repository';
import { GetAssetsReportUseCase } from '../../application/reports/get-assets-report/get-assets-report.usecase';
import { GetDepreciationReportUseCase } from '../../application/reports/get-depreciation-report/get-depreciation-report.usecase';
import { GetAssignmentsReportUseCase } from '../../application/reports/get-assignments-report/get-assignments-report.usecase';
import { GetMaintenancesReportUseCase } from '../../application/reports/get-maintenances-report/get-maintenances-report.usecase';
import { reportQuerySchema } from '../validators/reports/report.validator';
import { successResponse } from '../../shared/utils/response.util';

const repository = new ReportRepository();
const getAssetsReportUseCase = new GetAssetsReportUseCase(repository);
const getDepreciationReportUseCase = new GetDepreciationReportUseCase(repository);
const getAssignmentsReportUseCase = new GetAssignmentsReportUseCase(repository);
const getMaintenancesReportUseCase = new GetMaintenancesReportUseCase(repository);

export class ReportController {
  public static async getAssetsReport(request: FastifyRequest, reply: FastifyReply) {
    const validatedQuery = reportQuerySchema.parse(request.query);
    const result = await getAssetsReportUseCase.execute(validatedQuery);
    return reply.status(200).send(successResponse(result, 'Reporte de activos fijos generado correctamente.'));
  }

  public static async getDepreciationReport(request: FastifyRequest, reply: FastifyReply) {
    const validatedQuery = reportQuerySchema.parse(request.query);
    const result = await getDepreciationReportUseCase.execute(validatedQuery);
    return reply.status(200).send(successResponse(result, 'Reporte de depreciación contable generado correctamente.'));
  }

  public static async getAssignmentsReport(request: FastifyRequest, reply: FastifyReply) {
    const validatedQuery = reportQuerySchema.parse(request.query);
    const result = await getAssignmentsReportUseCase.execute(validatedQuery);
    return reply.status(200).send(successResponse(result, 'Reporte de asignaciones generado correctamente.'));
  }

  public static async getMaintenancesReport(request: FastifyRequest, reply: FastifyReply) {
    const validatedQuery = reportQuerySchema.parse(request.query);
    const result = await getMaintenancesReportUseCase.execute(validatedQuery);
    return reply.status(200).send(successResponse(result, 'Reporte de mantenimientos generado correctamente.'));
  }
}

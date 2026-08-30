import { FastifyRequest, FastifyReply } from 'fastify';
import { RepositoryFactory } from '../../../infrastructure/database/repository.factory';
import {
  createAcquisitionSchema,
  updateAcquisitionSchema,
  queryAcquisitionSchema,
  addAcquisitionDetailSchema,
} from '../../validators/acquisitions/acquisition.validator';
import { successResponse } from '../../../shared/utils/response.util';
import { NotFoundError } from '../../../shared/errors/app-error';
import {
  generateActaEntregaWordReport,
  generateActaDevolucionWordReport,
} from '../../../shared/utils/acta-entrega-word-report.util';

const acquisitionRepo = RepositoryFactory.getAcquisitionRepository();

export class AcquisitionController {
  public static async getAcquisitions(request: FastifyRequest, reply: FastifyReply) {
    const validatedQuery = queryAcquisitionSchema.parse(request.query);
    const { data, total } = await acquisitionRepo.findAll(validatedQuery);

    const totalPages = Math.ceil(total / validatedQuery.limit);

    return reply.status(200).send({
      success: true,
      message: 'Registros de personal obtenidos correctamente.',
      data,
      pagination: {
        total,
        page: validatedQuery.page,
        limit: validatedQuery.limit,
        totalPages,
      },
    });
  }

  public static async getAcquisitionById(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const item = await acquisitionRepo.findById(id);

    if (!item) {
      throw new NotFoundError('Registro de personal no encontrado.');
    }

    return reply.status(200).send(successResponse(item));
  }

  public static async createAcquisition(request: FastifyRequest, reply: FastifyReply) {
    const validatedBody = createAcquisitionSchema.parse(request.body);
    const created = await acquisitionRepo.create(validatedBody);

    return reply.status(201).send(successResponse(created, 'Registro de personal creado exitosamente.'));
  }

  public static async updateAcquisition(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const validatedBody = updateAcquisitionSchema.parse(request.body);

    const existing = await acquisitionRepo.findById(id);
    if (!existing) {
      throw new NotFoundError('Registro de personal no encontrado.');
    }

    const updated = await acquisitionRepo.update(id, validatedBody);

    return reply.status(200).send(successResponse(updated, 'Registro de personal actualizado exitosamente.'));
  }

  public static async deleteAcquisition(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };

    const existing = await acquisitionRepo.findById(id);
    if (!existing) {
      throw new NotFoundError('Registro de personal no encontrado.');
    }

    await acquisitionRepo.delete(id);

    return reply.status(200).send(successResponse(null, 'Registro de personal eliminado correctamente.'));
  }

  public static async addDetail(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const validatedBody = addAcquisitionDetailSchema.parse(request.body);

    const acquisition = await acquisitionRepo.findById(id);
    if (!acquisition) {
      throw new NotFoundError('Registro de personal no encontrado.');
    }

    const createdDetail = await acquisitionRepo.addDetail({
      acquisitionId: id,
      supplyId: validatedBody.supplyId,
      assetId: validatedBody.assetId,
      unit: validatedBody.unit,
      quantity: validatedBody.quantity,
    });

    return reply.status(201).send(successResponse(createdDetail, 'Detalle agregado exitosamente.'));
  }

  public static async deleteDetail(request: FastifyRequest, reply: FastifyReply) {
    const { detailId } = request.params as { detailId: string };
    await acquisitionRepo.deleteDetail(detailId);
    return reply.status(200).send(successResponse(null, 'Detalle eliminado correctamente.'));
  }

  public static async downloadActaEntregaWord(request: FastifyRequest, reply: FastifyReply) {
    if ((request.user as any)?.role === 'guest') {
      return reply.status(403).send({
        success: false,
        message: 'Acceso denegado. El usuario con rol invitado no tiene permiso para descargar actas de entrega.',
      });
    }

    const { id } = request.params as { id: string };
    const acquisition = await acquisitionRepo.findById(id);
    if (!acquisition) {
      throw new NotFoundError('Registro de personal no encontrado.');
    }

    const wordBuffer = await generateActaEntregaWordReport(acquisition);

    const safeName = (acquisition.checkoutUser?.fullName || acquisition.id).replace(/[^a-zA-Z0-9_-]/g, '_');
    const docPrefix = acquisition.type === 'ASSET' ? 'Acta_de_Prestamo' : 'Acta_de_Entrega';
    const filename = `${docPrefix}_${safeName}.docx`;

    return reply
      .header('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
      .header('Content-Disposition', `attachment; filename="${filename}"`)
      .send(wordBuffer);
  }

  public static async processDevolucion(request: FastifyRequest, reply: FastifyReply) {
    if ((request.user as any)?.role === 'guest') {
      return reply.status(403).send({
        success: false,
        message: 'Acceso denegado. El usuario con rol invitado no tiene permiso para realizar devoluciones.',
      });
    }

    const { id } = request.params as { id: string };
    const { detailIds } = request.body as { detailIds: string[] };

    if (!detailIds || !Array.isArray(detailIds) || detailIds.length === 0) {
      return reply.status(400).send({
        success: false,
        message: 'Debe seleccionar al menos un activo para la devolución.',
      });
    }

    const acquisition = await acquisitionRepo.findById(id);
    if (!acquisition) {
      throw new NotFoundError('Registro de personal no encontrado.');
    }

    // Filtrar los detalles que corresponden a los IDs recibidos
    const detailsToReturn = (acquisition.details || []).filter((d: any) =>
      detailIds.includes(d.id)
    );

    if (detailsToReturn.length === 0) {
      return reply.status(400).send({
        success: false,
        message: 'Los activos seleccionados no pertenecen a este registro.',
      });
    }

    // Generar el Buffer del Acta de Devolución en Word con los activos seleccionados
    const wordBuffer = await generateActaDevolucionWordReport(acquisition, detailsToReturn);

    // Liberar/Eliminar los detalles de la base de datos (se disminuye quantityOut automáticamente)
    for (const detailId of detailIds) {
      await acquisitionRepo.deleteDetail(detailId);
    }

    const safeName = (acquisition.checkoutUser?.fullName || acquisition.id).replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `Acta_de_Devolucion_${safeName}.docx`;

    return reply
      .header('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
      .header('Content-Disposition', `attachment; filename="${filename}"`)
      .send(wordBuffer);
  }
}

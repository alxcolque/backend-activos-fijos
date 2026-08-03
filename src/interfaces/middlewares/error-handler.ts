import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { AppError } from '../../shared/errors/app-error';
import { errorResponse } from '../../shared/utils/response.util';
import { logger } from '../../infrastructure/logger/logger';
import { ZodError } from 'zod';

export const errorHandler = (
  error: FastifyError | AppError | ZodError | Error,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  logger.error(
    {
      err: error,
      url: request.url,
      method: request.method,
    },
    'Global Error Handler caught an exception',
  );

  if (error instanceof AppError) {
    return reply.status(error.statusCode).send(errorResponse(error.message, error.errors));
  }

  if (error instanceof ZodError) {
    const formattedErrors = error.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    return reply.status(400).send(errorResponse('Error de validación', formattedErrors));
  }

  const statusCode = (error as FastifyError).statusCode || 500;
  const message = error.message || 'Error interno del servidor';

  return reply.status(statusCode).send(errorResponse(message));
};

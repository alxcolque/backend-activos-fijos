import { logger } from '../../infrastructure/logger/logger';

export async function logAssetHistory(
  assetId: string,
  userId: string | undefined,
  action: string,
  description: string,
): Promise<void> {
  logger.info({ assetId, userId, action, description }, 'Evento de activo registrado en log');
}

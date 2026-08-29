import { PrismaClient } from '@prisma/client';
import { logger } from '../../src/infrastructure/logger/logger';

export async function seedAcquisitions(prisma: PrismaClient) {
  logger.info('🌱 Seeding Acquisitions (Personal)...');

  const users = await prisma.user.findMany({ take: 3 });
  const projects = await prisma.project.findMany({ take: 2 });
  const supplies = await prisma.supply.findMany({ take: 2 });
  const assets = await prisma.asset.findMany({ take: 2 });

  if (users.length === 0) {
    logger.warn('⚠️ No users found for acquisitions seed.');
    return;
  }

  const adminUser = users[0];
  const guestUser = users[2] || adminUser;
  const project1 = projects[0] || null;
  const supply1 = supplies[0] || null;
  const asset1 = assets[0] || null;

  const existingCount = await prisma.acquisition.count();
  if (existingCount > 0) {
    logger.info('ℹ️ Acquisitions already seeded.');
    return;
  }

  // Registro tipo SUPPLY
  await prisma.acquisition.create({
    data: {
      userId: adminUser.id,
      projectId: project1 ? project1.id : null,
      checkoutUserId: guestUser.id,
      departureDate: new Date(),
      type: 'SUPPLY',
      details: supply1
        ? {
            create: [
              {
                supplyId: supply1.id,
                unit: supply1.unit,
                quantity: 5,
              },
            ],
          }
        : undefined,
    },
  });

  // Registro tipo ASSET
  if (asset1) {
    await prisma.acquisition.create({
      data: {
        userId: adminUser.id,
        projectId: project1 ? project1.id : null,
        checkoutUserId: guestUser.id,
        departureDate: new Date(),
        type: 'ASSET',
        details: {
          create: [
            {
              assetId: asset1.id,
              unit: 'PZA',
              quantity: 1,
            },
          ],
        },
      },
    });
  }

  logger.info('✅ Acquisitions (Personal) Seeded.');
}

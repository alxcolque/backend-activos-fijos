import { PrismaClient } from '@prisma/client';
import { logger } from '../../src/infrastructure/logger/logger';

export async function seedAcquisitions(prisma: PrismaClient) {
  logger.info('🌱 Seeding Acquisitions (Personal)...');

  const users = await prisma.user.findMany({ take: 3 });
  const projects = await prisma.project.findMany({ take: 2 });

  if (users.length === 0) {
    logger.warn('⚠️ No users found for acquisitions seed.');
    return;
  }

  const adminUser = users[0];
  const operatorUser = users[1] || adminUser;
  const guestUser = users[2] || adminUser;
  const project1 = projects[0] || null;

  const existingCount = await prisma.acquisition.count();
  if (existingCount > 0) {
    logger.info('ℹ️ Acquisitions already seeded.');
    return;
  }

  await prisma.acquisition.create({
    data: {
      userId: adminUser.id,
      projectUserId: operatorUser.id,
      checkoutUserId: guestUser.id,
      departureDate: new Date(),
      details: {
        create: [
          {
            projectId: project1 ? project1.id : null,
            unit: 'caja',
            quantity: 5,
          },
        ],
      },
    },
  });

  logger.info('✅ Acquisitions (Personal) Seeded.');
}

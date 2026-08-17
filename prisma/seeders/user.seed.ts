import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

export async function seedUsers(prisma: PrismaClient): Promise<void> {
  console.log('🌱 Seeding Users...');

  const hashedPassword = await bcrypt.hash('comibol123', 10);

  await prisma.user.upsert({
    where: { email: 'admin@comibol.gob.bo' },
    update: {
      fullName: 'Administrador',
      password: hashedPassword,
      isActive: true,
    },
    create: {
      email: 'admin@comibol.gob.bo',
      fullName: 'Administrador',
      password: hashedPassword,
      isActive: true,
    },
  });

  console.log('✅ Users Seeded');
}

import { PrismaClient } from '@prisma/client';

export async function seedLocations(prisma: PrismaClient): Promise<void> {
  console.log('🌱 Seeding Root Location...');

  await prisma.location.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {
      name: 'COMIBOL',
      code: 'COMIBOL-ROOT',
      description: 'Oficina Central y Operaciones Corporativas de COMIBOL',
    },
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'COMIBOL',
      code: 'COMIBOL-ROOT',
      description: 'Oficina Central y Operaciones Corporativas de COMIBOL',
    },
  });

  console.log('✅ Root Location Seeded');
}

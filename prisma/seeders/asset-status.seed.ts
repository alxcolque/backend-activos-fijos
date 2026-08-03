import { PrismaClient } from '@prisma/client';

export async function seedAssetStatuses(prisma: PrismaClient): Promise<void> {
  console.log('🌱 Seeding Asset Statuses...');

  const statuses = [
    {
      name: 'Activo',
      description: 'Activo fijo en correcto estado operativo y disponible para uso',
    },
    {
      name: 'En mantenimiento',
      description: 'Activo fijo en proceso de reparación o mantenimiento técnico',
    },
    {
      name: 'Fuera de servicio',
      description: 'Activo temporalmente fuera de funcionamiento o inoperativo',
    },
    {
      name: 'De baja',
      description: 'Activo fijo retirado o desincorporado definitivamente del inventario',
    },
    {
      name: 'Extraviado',
      description: 'Activo reportado como extraviado o no localizado en inspección física',
    },
  ];

  for (const status of statuses) {
    await prisma.assetStatus.upsert({
      where: { name: status.name },
      update: { description: status.description },
      create: status,
    });
  }

  console.log('✅ Asset Statuses Seeded');
}

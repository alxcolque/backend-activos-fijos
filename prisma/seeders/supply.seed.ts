import { PrismaClient } from '@prisma/client';

export async function seedSupplies(prisma: PrismaClient): Promise<void> {
  console.log('🌱 Seeding Supplies (Materiales/Suministros)...');

  const supplyCategory = await prisma.assetCategory.findFirst({
    where: { type: 'SUPPLY' },
  });
  const firstLocation = await prisma.location.findFirst();

  const sampleSupplies = [
    {
      name: 'Lápiz',
      unit: 'caja',
      inputQuantity: 10,
      outputQuantity: 0,
      entryDate: new Date('2026-07-26T00:00:00.000Z'),
      observations: 'De 50 unidades',
      categoryId: supplyCategory?.id || null,
      locationId: firstLocation?.id || null,
    },
    {
      name: 'Papel Bond A4 75g',
      unit: 'paquete',
      inputQuantity: 50,
      outputQuantity: 5,
      entryDate: new Date('2026-08-01T00:00:00.000Z'),
      observations: 'Marca Chamex 500 hojas',
      categoryId: supplyCategory?.id || null,
      locationId: firstLocation?.id || null,
    },
    {
      name: 'Bolígrafo Azul',
      unit: 'caja',
      inputQuantity: 20,
      outputQuantity: 2,
      entryDate: new Date('2026-08-10T00:00:00.000Z'),
      observations: 'Caja de 12 unidades Faber-Castell',
      categoryId: supplyCategory?.id || null,
      locationId: firstLocation?.id || null,
    },
  ];

  for (const s of sampleSupplies) {
    const existing = await prisma.supply.findFirst({
      where: { name: s.name },
    });

    if (!existing) {
      await prisma.supply.create({ data: s });
    }
  }

  console.log('✅ Supplies Seeded.');
}

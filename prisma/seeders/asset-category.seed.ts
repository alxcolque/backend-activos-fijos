import { PrismaClient } from '@prisma/client';

export async function seedAssetCategories(prisma: PrismaClient): Promise<void> {
  console.log('🌱 Seeding Asset Categories...');

  const categories = [
    {
      name: 'Maquinaria',
      description: 'Maquinaria industrial y pesada para operaciones mineras e institucionales',
    },
    {
      name: 'Herramientas',
      description: 'Herramientas manuales, eléctricas y mecánicas de apoyo operativo',
    },
    {
      name: 'Vehículos Livianos',
      description: 'Camionetas, vagonetas, automóviles y motocicletas institucionales',
    },
    {
      name: 'Vehículos Pesados',
      description: 'Camiones volqueta, cisternas, tractores y equipo pesado de transporte',
    },
    {
      name: 'Mobiliario',
      description: 'Muebles, escritorios, estantes, sillas y enseres de oficina',
    },
    {
      name: 'Equipos Informáticos',
      description: 'Computadoras, servidores, impresoras, monitores y equipos de red',
    },
  ];

  for (const cat of categories) {
    await prisma.assetCategory.upsert({
      where: { name: cat.name },
      update: { description: cat.description },
      create: cat,
    });
  }

  console.log('✅ Asset Categories Seeded');
}

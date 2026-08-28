import { PrismaClient } from '@prisma/client';

export async function seedAssetCategories(prisma: PrismaClient): Promise<void> {
  console.log('🌱 Seeding Asset Categories (Activos Fijos y Suministros)...');

  const categories = [
    // Categorías de Activos Fijos (type: ASSET)
    {
      name: 'Maquinaria',
      description: 'Maquinaria industrial y pesada para operaciones mineras e institucionales',
      type: 'ASSET',
      usefulLife: 8,
    },
    {
      name: 'Herramientas de Trabajo',
      description: 'Herramientas mecánicas y eléctricas de apoyo operativo',
      type: 'ASSET',
      usefulLife: 4,
    },
    {
      name: 'Vehículos Livianos',
      description: 'Camionetas, vagonetas, automóviles y motocicletas institucionales',
      type: 'ASSET',
      usefulLife: 5,
    },
    {
      name: 'Vehículos Pesados',
      description: 'Camiones volqueta, cisternas, tractores y equipo pesado de transporte',
      type: 'ASSET',
      usefulLife: 8,
    },
    {
      name: 'Mobiliario',
      description: 'Muebles, escritorios, estantes, sillas y enseres de oficina',
      type: 'ASSET',
      usefulLife: 10,
    },
    {
      name: 'Equipos Informáticos',
      description: 'Computadoras, servidores, impresoras, monitores y equipos de red',
      type: 'ASSET',
      usefulLife: 4,
    },
    // Categorías de Suministros (type: SUPPLY)
    {
      name: 'Materiales de Oficina',
      description: 'Papelería, bolígrafos, fólderes y útiles de escritorio',
      type: 'SUPPLY',
      usefulLife: 0,
    },
    {
      name: 'Insumos de Limpieza',
      description: 'Detergentes, desinfectantes, franelas y artículos de aseo',
      type: 'SUPPLY',
      usefulLife: 0,
    },
    {
      name: 'Herramientas Menores',
      description: 'Consumibles y herramientas menores de reemplazo rápido',
      type: 'SUPPLY',
      usefulLife: 0,
    },
    {
      name: 'Repuestos y Accesorios',
      description: 'Repuestos mecánicos, eléctricos e insumos técnicos',
      type: 'SUPPLY',
      usefulLife: 0,
    },
  ];

  for (const cat of categories) {
    await prisma.assetCategory.upsert({
      where: { name: cat.name },
      update: { description: cat.description, type: cat.type, usefulLife: cat.usefulLife },
      create: cat,
    });
  }

  console.log('✅ Asset & Supply Categories Seeded');
}

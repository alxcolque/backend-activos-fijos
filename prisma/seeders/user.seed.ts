import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

export async function seedUsers(prisma: PrismaClient): Promise<void> {
  console.log('🌱 Seeding Users (Admin, Operador, Guest)...');

  const hashedPassword = await bcrypt.hash('comibol1996', 10);

  // Eliminar antiguo admin si existía
  try {
    await prisma.user.deleteMany({
      where: { email: 'admin@comibol.gob.bo' },
    });
  } catch {
    // Ignorar si no existe
  }

  // 1. Administrador Principal (Acceso Total)
  await prisma.user.upsert({
    where: { email: 'paula.comibol@gmail.com' },
    update: {
      fullName: 'Paula Administrador',
      profession: 'Administrador de Empresas',
      password: hashedPassword,
      role: 'admin',
      isActive: true,
    } as any,
    create: {
      email: 'paula.comibol@gmail.com',
      fullName: 'Paula Administrador',
      profession: 'Administrador de Empresas',
      password: hashedPassword,
      role: 'admin',
      isActive: true,
    } as any,
  });

  // 2. Operador (Gestión Operativa de Activos y Proyectos sin acceso a Usuarios / Ajustes)
  await prisma.user.upsert({
    where: { email: 'operador.comibol@gmail.com' },
    update: {
      fullName: 'Operador de Campo',
      profession: 'Ingeniero de Minas',
      password: hashedPassword,
      role: 'operador',
      isActive: true,
    } as any,
    create: {
      email: 'operador.comibol@gmail.com',
      fullName: 'Operador de Campo',
      profession: 'Ingeniero de Minas',
      password: hashedPassword,
      role: 'operador',
      isActive: true,
    } as any,
  });

  // 3. Invitado / Guest (Solo Lectura y Filtros en Panel, Activos y Proyectos)
  await prisma.user.upsert({
    where: { email: 'invitado.comibol@gmail.com' },
    update: {
      fullName: 'Usuario Invitado',
      profession: 'Auxiliar Administrativo',
      password: hashedPassword,
      role: 'guest',
      isActive: true,
    } as any,
    create: {
      email: 'invitado.comibol@gmail.com',
      fullName: 'Usuario Invitado',
      profession: 'Auxiliar Administrativo',
      password: hashedPassword,
      role: 'guest',
      isActive: true,
    } as any,
  });

  console.log('✅ Users Seeded (admin, operador, guest)');
}

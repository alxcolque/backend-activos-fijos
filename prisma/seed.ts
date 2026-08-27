import { PrismaClient } from '@prisma/client';
import {
  seedUsers,
  seedAssetCategories,
  seedAssetStatuses,
  seedLocations,
  seedSupplies,
} from './seeders';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting Database Seed...');

  await seedUsers(prisma);
  await seedAssetCategories(prisma);
  await seedAssetStatuses(prisma);
  await seedLocations(prisma);
  await seedSupplies(prisma);

  console.log('🎉 Database seeded successfully.');
}

main()
  .catch((e) => {
    console.error('❌ Error executing database seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

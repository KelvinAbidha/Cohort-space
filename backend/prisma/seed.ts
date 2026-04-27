import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 1. Create Units (Course Departments)
  const unit1 = await prisma.unit.upsert({
    where: { name: 'CIT 2313: Software Quality Assurance' },
    update: {},
    create: { name: 'CIT 2313: Software Quality Assurance' },
  });

  const unit2 = await prisma.unit.upsert({
    where: { name: 'CIT 2210: Distributed Systems' },
    update: {},
    create: { name: 'CIT 2210: Distributed Systems' },
  });

  // 2. Create Workspaces (Empty Assignment Groups)
  // These are the groups students can join using the 'code'
  await prisma.workspace.upsert({
    where: { name: 'Team Alpha - STQA' },
    update: {},
    create: {
      name: 'Team Alpha - STQA',
      code: 'STQA-GP1',
      unitId: unit1.id,
    },
  });

  await prisma.workspace.upsert({
    where: { name: 'Beta Testers - STQA' },
    update: {},
    create: {
      name: 'Beta Testers - STQA',
      code: 'STQA-GP2',
      unitId: unit1.id,
    },
  });

  await prisma.workspace.upsert({
    where: { name: 'Node Masters - DS' },
    update: {},
    create: {
      name: 'Node Masters - DS',
      code: 'DS-GP1',
      unitId: unit2.id,
    },
  });

  await prisma.workspace.upsert({
    where: { name: 'Cluster Kings - DS' },
    update: {},
    create: {
      name: 'Cluster Kings - DS',
      code: 'DS-GP2',
      unitId: unit2.id,
    },
  });

  console.log('✅ Database structure initialized.');
  console.log('-------------------------------------------');
  console.log('Students can join using codes:');
  console.log('- STQA-GP1');
  console.log('- STQA-GP2');
  console.log('- DS-GP1');
  console.log('- DS-GP2');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

export const seed = main;

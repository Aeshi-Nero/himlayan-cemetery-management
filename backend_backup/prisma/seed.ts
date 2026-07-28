import { PrismaClient, UserRole, PlotStatus, LotType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const passwordHash = await bcrypt.hash('Admin@123', 12);

  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@himlayan.gov.ph' },
    update: {},
    create: {
      email: 'admin@himlayan.gov.ph',
      passwordHash,
      fullName: 'System Administrator',
      role: UserRole.super_admin,
      isActive: true,
    },
  });

  const rcc = await prisma.user.upsert({
    where: { email: 'rcc@himlayan.gov.ph' },
    update: {},
    create: {
      email: 'rcc@himlayan.gov.ph',
      passwordHash,
      fullName: 'Records Clerk',
      role: UserRole.rcc,
      isActive: true,
    },
  });

  const engineer = await prisma.user.upsert({
    where: { email: 'engineer@himlayan.gov.ph' },
    update: {},
    create: {
      email: 'engineer@himlayan.gov.ph',
      passwordHash,
      fullName: 'Mapping Engineer',
      role: UserRole.engineer,
      isActive: true,
    },
  });

  const staff = await prisma.user.upsert({
    where: { email: 'staff@himlayan.gov.ph' },
    update: {},
    create: {
      email: 'staff@himlayan.gov.ph',
      passwordHash,
      fullName: 'Staff Member',
      role: UserRole.staff,
      isActive: true,
    },
  });

  console.log('  Users created:', { superAdmin, rcc, engineer, staff });

  const sections = ['A', 'B', 'C', 'D'];
  const lotTypes: LotType[] = ['single', 'family', 'apartment'];
  const statuses: PlotStatus[] = ['available', 'available', 'available', 'reserved', 'occupied'];

  for (const section of sections) {
    for (let i = 1; i <= 20; i++) {
      const plotNumber = `${section}${String(i).padStart(3, '0')}`;
      const lat = 16.5 + Math.random() * 0.1;
      const lng = 121.0 + Math.random() * 0.1;
      const lotType = lotTypes[Math.floor(Math.random() * lotTypes.length)];
      const capacity = lotType === 'single' ? 1 : lotType === 'family' ? 4 : 8;
      const status = statuses[Math.floor(Math.random() * statuses.length)];

      await prisma.plot.upsert({
        where: { plotNumber },
        update: {},
        create: {
          plotNumber,
          section,
          lat,
          lng,
          lotType,
          capacity,
          currentOccupants: status === 'occupied' || status === 'full' ? Math.floor(Math.random() * capacity) + 1 : 0,
          status,
          price: lotType === 'single' ? 15000 : lotType === 'family' ? 35000 : 60000,
        },
      });
    }
  }

  console.log('  Plots created: 80');

  const nodes = [];
  for (let i = 1; i <= 20; i++) {
    const node = await prisma.pathNode.create({
      data: {
        lat: 16.52 + Math.random() * 0.06,
        lng: 121.02 + Math.random() * 0.06,
        nodeLabel: `Node ${String.fromCharCode(64 + i)}`,
        isAccessible: true,
      },
    });
    nodes.push(node);
  }

  console.log('  Path nodes created:', nodes.length);

  for (let i = 1; i < nodes.length; i++) {
    await prisma.pathEdge.create({
      data: {
        fromNodeId: nodes[i - 1].id,
        toNodeId: nodes[i].id,
        distanceWeight: Math.round((Math.random() * 50 + 10) * 100) / 100,
        pathwayName: `Pathway ${String.fromCharCode(64 + i)}-${String.fromCharCode(65 + i)}`,
      },
    });
  }

  for (let i = 2; i < nodes.length - 1; i += 3) {
    await prisma.pathEdge.create({
      data: {
        fromNodeId: nodes[i].id,
        toNodeId: nodes[i + 2].id,
        distanceWeight: Math.round((Math.random() * 30 + 5) * 100) / 100,
        pathwayName: `Shortcut ${String.fromCharCode(64 + i + 1)}`,
      },
    });
  }

  console.log('  Path edges created');

  const clients = [
    { fullName: 'Juan Dela Cruz', contactNumber: '09171234567', email: 'juan@email.com' },
    { fullName: 'Maria Santos', contactNumber: '09181234567', email: 'maria@email.com' },
    { fullName: 'Pedro Reyes', contactNumber: '09191234567', email: 'pedro@email.com' },
    { fullName: 'Ana Gonzales', contactNumber: '09201234567', email: 'ana@email.com' },
  ];

  for (const c of clients) {
    await prisma.client.create({
      data: { ...c, idNumber: `ID-${Math.random().toString(36).substring(2, 10).toUpperCase()}` },
    });
  }

  console.log('  Clients created:', clients.length);

  const lotTypesData = [
    { name: 'Single', description: 'Single burial lot for one individual', defaultCapacity: 1 },
    { name: 'Family', description: 'Family lot for up to 4 burials', defaultCapacity: 4 },
    { name: 'Apartment', description: 'Multi-level apartment style lot for up to 8 burials', defaultCapacity: 8 },
  ];

  for (const lt of lotTypesData) {
    await prisma.lotTypeCategory.create({ data: lt });
  }

  console.log('  Lot types created');
  console.log('Seeding complete!');
  console.log('\nDefault accounts (password: Admin@123):');
  console.log('  Super Admin: admin@himlayan.gov.ph');
  console.log('  RCC: rcc@himlayan.gov.ph');
  console.log('  Engineer: engineer@himlayan.gov.ph');
  console.log('  Staff: staff@himlayan.gov.ph');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

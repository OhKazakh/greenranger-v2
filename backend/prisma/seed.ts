import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import locations from './locations.json';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// locations.json is an export of the verified production dataset
// (researched real recycling points in Astana). Edit the JSON, not this file.

async function main() {
  console.log('Seeding database...');

  await prisma.location.deleteMany();
  console.log('Cleared existing locations');

  for (const loc of locations) {
    // locations.json always carries a photos array (exported from prod)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = { ...loc } as any;
    await prisma.location.create({ data });
  }

  console.log(`Seeded ${locations.length} locations`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

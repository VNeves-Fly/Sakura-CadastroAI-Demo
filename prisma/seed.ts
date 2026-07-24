import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { seedAdminUser } from "./seeds/admin-user";
import { seedSignatariosPadrao } from "./seeds/signatarios-padrao";
import { seedPromotores } from "./seeds/promotores";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  await seedAdminUser(prisma);
  await seedSignatariosPadrao(prisma);
  await seedPromotores(prisma);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

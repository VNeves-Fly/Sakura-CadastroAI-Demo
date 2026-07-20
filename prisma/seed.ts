import { PrismaClient } from "@prisma/client";
import { seedAdminUser } from "./seeds/admin-user";
import { seedSignatariosPadrao } from "./seeds/signatarios-padrao";

const prisma = new PrismaClient();

async function main() {
  await seedAdminUser(prisma);
  await seedSignatariosPadrao(prisma);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("password123", 10);

  await prisma.user.upsert({
    where: { email: "admin@cadastro-ia-sakura.com" },
    update: {},
    create: {
      name: "Admin",
      email: "admin@cadastro-ia-sakura.com",
      password: passwordHash,
    },
  });

  console.log("Seed concluído: usuário admin@cadastro-ia-sakura.com / password123");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

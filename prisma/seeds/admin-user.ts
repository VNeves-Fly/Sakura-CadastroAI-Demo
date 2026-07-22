import type { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const ADMIN_EMAIL = "admin@cadastroai.com";
const ADMIN_SENHA = "Sakura@2026";

export async function seedAdminUser(prisma: PrismaClient): Promise<void> {
  const passwordHash = await bcrypt.hash(ADMIN_SENHA, 10);

  await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: {},
    create: {
      name: "Admin",
      firstName: "Admin",
      lastName: "Sakura",
      phone: "",
      cargo: "ADMIN",
      email: ADMIN_EMAIL,
      password: passwordHash,
    },
  });

  console.warn(`Seed: usuário admin (${ADMIN_EMAIL})`);
}

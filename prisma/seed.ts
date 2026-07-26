import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { seedAdminUser } from "./seeds/admin-user";
import { seedSignatariosPadrao } from "./seeds/signatarios-padrao";
import { seedPromotores } from "./seeds/promotores";
import { seedAssociacoes } from "./seeds/associacoes";

// O driver `pg` não interpreta `?schema=` da connection string (só o engine
// antigo do Prisma fazia isso) — precisa repassar explicitamente pro
// adapter, senão cai no search_path padrão (public) e as tabelas não são
// encontradas. Mesmo padrão de src/modules/shared/infrastructure/prisma/client.ts.
const schema = process.env.DATABASE_URL
  ? (new URL(process.env.DATABASE_URL).searchParams.get("schema") ?? undefined)
  : undefined;

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL }, { schema });
const prisma = new PrismaClient({ adapter });

async function main() {
  await seedAdminUser(prisma);
  await seedSignatariosPadrao(prisma);
  await seedPromotores(prisma);
  await seedAssociacoes(prisma);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

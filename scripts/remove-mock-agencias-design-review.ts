// Companion de limpeza do seed-mock-agencias-design-review.ts — apaga as
// 24 agências criadas pra revisão visual (ids "mock-ag-01".."mock-ag-24").
// Rodar com: bun scripts/remove-mock-agencias-design-review.ts

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const schema = process.env.DATABASE_URL
  ? (new URL(process.env.DATABASE_URL).searchParams.get("schema") ?? undefined)
  : undefined;

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL }, { schema });
const prisma = new PrismaClient({ adapter });

async function main() {
  if (!process.env.DATABASE_URL?.includes("localhost")) {
    throw new Error("DATABASE_URL não aponta pra localhost — abortando por segurança.");
  }

  const resultado = await prisma.agencia.deleteMany({
    where: { id: { startsWith: "mock-ag-" } },
  });

  console.warn(`Limpeza: ${resultado.count} agências de revisão removidas.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

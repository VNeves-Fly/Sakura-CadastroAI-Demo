import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { seedAdminUser } from "./seeds/admin-user";
import { seedSignatariosPadrao } from "./seeds/signatarios-padrao";
import { seedPromotores } from "./seeds/promotores";
import { seedAssociacoes } from "./seeds/associacoes";
import { seedCidadesComerciais } from "./seeds/cidades-comerciais";

// O driver `pg` não interpreta `?schema=` da connection string (só o engine
// antigo do Prisma fazia isso) — precisa repassar explicitamente pro
// adapter, senão cai no search_path padrão (public) e as tabelas não são
// encontradas. Mesmo padrão de src/modules/shared/infrastructure/prisma/client.ts.
const schema = process.env.DATABASE_URL
  ? (new URL(process.env.DATABASE_URL).searchParams.get("schema") ?? undefined)
  : undefined;

// Cloud SQL's legacy per-instance CA doesn't put the connection IP in the
// cert's SAN, so hostname verification (sslmode=verify-full) always fails —
// verificamos a cadeia contra a CA da própria instância (verify-ca) e
// pulamos só a checagem de hostname, em vez de cair pra sslmode=no-verify.
// Mesmo tratamento de src/modules/shared/infrastructure/prisma/client.ts —
// sem isso, rodar o seed contra o Postgres real (produção) falha com
// "unable to verify the first certificate".
const adapter = new PrismaPg(
  {
    connectionString: process.env.DATABASE_URL,
    ...(process.env.DATABASE_CA_CERT && {
      ssl: {
        ca: process.env.DATABASE_CA_CERT,
        rejectUnauthorized: true,
        checkServerIdentity: () => undefined,
      },
    }),
  },
  { schema },
);
const prisma = new PrismaClient({ adapter });

async function main() {
  await seedAdminUser(prisma);
  await seedSignatariosPadrao(prisma);
  await seedPromotores(prisma);
  await seedAssociacoes(prisma);
  await seedCidadesComerciais(prisma);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

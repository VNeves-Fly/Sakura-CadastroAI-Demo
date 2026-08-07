import { prisma } from "@/modules/shared/infrastructure/prisma/client";

// Vincula Gestor.userId/Promotor.userId a Users já existentes com o mesmo
// e-mail — cobre os registros importados da planilha antes de existir a
// checkbox "Criar acesso na plataforma" (que já resolve userId na criação,
// ver Gestor.userId/Promotor.userId em schema.prisma), então hoje aparecem
// como "Sem acesso" mesmo tendo login de verdade. Match exato de e-mail
// (trim+lowercase, mesma normalização de gestores.adapter.ts/
// promotores-crud.adapter.ts). Idempotente — só atualiza onde userId ainda
// é null.
//
// Uso: DATABASE_URL=... DATABASE_CA_CERT=... bun run prisma/scripts/backfill-userid-gestores-promotores.ts
async function main() {
  const promotoresVinculados = await vincular("promotor");
  const gestoresVinculados = await vincular("gestor");

  console.warn(
    `Concluído: ${promotoresVinculados} promotor(es) vinculado(s), ${gestoresVinculados} gestor(es) vinculado(s).`,
  );
}

async function vincular(modelo: "promotor" | "gestor"): Promise<number> {
  const registros =
    modelo === "promotor"
      ? await prisma.promotor.findMany({
          where: { userId: null },
          select: { id: true, nome: true, email: true },
        })
      : await prisma.gestor.findMany({
          where: { userId: null },
          select: { id: true, nome: true, email: true },
        });

  let vinculados = 0;
  for (const registro of registros) {
    const email = registro.email?.trim().toLowerCase();
    if (!email) continue;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) continue;

    // userId é @unique em Promotor/Gestor — um User só pode ficar vinculado
    // a um registro de cada tipo por vez; se já está vinculado a outro (ex.:
    // duas linhas legadas com o mesmo e-mail), pula em vez de estourar a
    // constraint.
    const jaVinculado =
      modelo === "promotor"
        ? await prisma.promotor.findUnique({ where: { userId: user.id } })
        : await prisma.gestor.findUnique({ where: { userId: user.id } });
    if (jaVinculado) {
      console.warn(
        `AVISO: User ${user.id} (${email}) já vinculado a outro ${modelo} (${jaVinculado.id}) — pulando "${registro.nome}".`,
      );
      continue;
    }

    if (modelo === "promotor") {
      await prisma.promotor.update({ where: { id: registro.id }, data: { userId: user.id } });
    } else {
      await prisma.gestor.update({ where: { id: registro.id }, data: { userId: user.id } });
    }
    vinculados += 1;
    console.warn(`OK: ${modelo} "${registro.nome}" (${email}) -> User ${user.id}`);
  }
  return vinculados;
}

main()
  .catch((error) => {
    console.error("Falha no backfill:", error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

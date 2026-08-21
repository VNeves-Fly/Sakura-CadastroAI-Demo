// Script AVULSO, temporário — pedido do usuário (2026-08-21): criar
// agências de verdade no banco LOCAL (localhost:5432, confirmado antes de
// rodar) só pra poder abrir /crm/agencias/[id] de verdade (Dashboard,
// Dados & Documentação, Faturas) sem cair em 404, já que a base local
// tinha poucas agências. Usa as MESMAS 24 identidades de
// src/dev/mock-agencias-fixture.ts (mesmo id/nome/cnpj/sica/status), pra
// bater com o que já aparece na listagem. Rodar com:
//   bun scripts/seed-mock-agencias-design-review.ts
// Companion de limpeza: scripts/remove-mock-agencias-design-review.ts

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { MOCK_AGENCIAS_CRM } from "../src/dev/mock-agencias-fixture";

const schema = process.env.DATABASE_URL
  ? (new URL(process.env.DATABASE_URL).searchParams.get("schema") ?? undefined)
  : undefined;

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL }, { schema });
const prisma = new PrismaClient({ adapter });

async function main() {
  if (!process.env.DATABASE_URL?.includes("localhost")) {
    throw new Error(
      "DATABASE_URL não aponta pra localhost — abortando por segurança (este script só deve rodar contra o banco local de dev).",
    );
  }

  let criadas = 0;
  let existentes = 0;

  for (const agencia of MOCK_AGENCIAS_CRM) {
    const jaExiste = await prisma.agencia.findUnique({ where: { id: agencia.id } });
    if (jaExiste) {
      existentes++;
      continue;
    }

    await prisma.agencia.create({
      data: {
        id: agencia.id,
        razaoSocial: agencia.razaoSocial,
        nomeFantasia: agencia.razaoSocial.split(" ").slice(0, 2).join(" "),
        cnpj: agencia.cnpj,
        status: agencia.status as never, // StatusAgencia — vem de "ativo"|"recusado" na fixture
        contratoSocialPath: "mock/contrato-social-review.pdf",
        emailContato: `contato@${agencia.id}.mock`,
        telefoneContato: "11999990000",
        sicaCodigo: agencia.sica,
      },
    });
    criadas++;
  }

  console.warn(`Seed de revisão: ${criadas} agências criadas, ${existentes} já existiam.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

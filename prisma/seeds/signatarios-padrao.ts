import type { PrismaClient, PapelSignatarioPadrao } from "@prisma/client";

// Os 4 signatários fixos da Sakura, sempre os mesmos em todo contrato —
// participam da segunda parte da assinatura (depois dos sócios, estágio
// 0, que não entram aqui por serem dinâmicos por cadastro) — ver
// docs/d4sign.md. `estagio` é o after_position da fila de assinatura no
// D4Sign; `papel` é o `act` correspondente.
const SIGNATARIOS_PADRAO: Array<{
  nome: string;
  cargo: string;
  email: string;
  papel: PapelSignatarioPadrao;
  estagio: number;
  ordem: number;
}> = [
  {
    nome: "Jean",
    cargo: "Time Cadastro",
    email: "cadastro@sakuratur.com.br",
    papel: "APROVAR",
    estagio: 1,
    ordem: 1,
  },
  {
    nome: "Vivi Siqueira",
    cargo: "Sakura",
    email: "vivi.siqueira@sakuratur.com.br",
    papel: "ASSINAR_COMO_PARTE",
    estagio: 2,
    ordem: 2,
  },
  {
    nome: "Wagner Chaves",
    cargo: "Sakura",
    email: "wagner.chaves@sakuratur.com.br",
    papel: "ASSINAR_COMO_TESTEMUNHA",
    estagio: 2,
    ordem: 3,
  },
  {
    nome: "Jennifer Araujo",
    cargo: "Sakura",
    email: "jennifer.araujo@sakuratur.com.br",
    papel: "ASSINAR_COMO_TESTEMUNHA",
    estagio: 2,
    ordem: 4,
  },
];

export async function seedSignatariosPadrao(prisma: PrismaClient): Promise<void> {
  for (const signatario of SIGNATARIOS_PADRAO) {
    await prisma.signatarioPadrao.upsert({
      where: { email: signatario.email },
      update: signatario,
      create: signatario,
    });
  }

  console.log(`Seed: ${SIGNATARIOS_PADRAO.length} signatários padrão da Sakura`);
}

import { PrismaClient, type PapelSignatarioPadrao } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Os 4 signatários fixos da Sakura, sempre os mesmos em todo contrato — ver
// docs/d4sign.md. `estagio` é o after_position da fila de assinatura no
// D4Sign (estágio 0 = sócios da agência, dinâmico, fora desta tabela).
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

  for (const signatario of SIGNATARIOS_PADRAO) {
    await prisma.signatarioPadrao.upsert({
      where: { email: signatario.email },
      update: signatario,
      create: signatario,
    });
  }

  console.log("Seed concluído: usuário admin@cadastro-ia-sakura.com / password123");
  console.log(`Seed concluído: ${SIGNATARIOS_PADRAO.length} signatários padrão da Sakura`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

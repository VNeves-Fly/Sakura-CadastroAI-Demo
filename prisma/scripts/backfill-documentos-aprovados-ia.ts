import { prisma } from "@/modules/shared/infrastructure/prisma/client";
import { PrismaDocumentoRepository } from "@/modules/cadastro/infrastructure/repositories/prisma-documento.repository";

// Backfill único (não é seed) — corrige documentos que ficaram PENDENTE
// (amarelo no dossiê) mesmo com a IA já tendo aprovado aquele documento
// especificamente, porque foram analisados ANTES do fix em
// AnalisarCadastroUseCase (commit d594d1c, 2026-07-28) que passou a
// aprovar documento a documento em vez de só no tudo-ou-nada. Roda uma
// vez, é seguro rodar de novo (só mexe em quem ainda está PENDENTE com
// parecer da IA = APROVADO — depois da primeira passada não sobra
// nenhuma linha pra corrigir). Não toca em documentos que a IA reprovou
// ou nunca avaliou — esses continuam PENDENTE de propósito.
//
// Uso: DATABASE_URL=... bun run prisma/scripts/backfill-documentos-aprovados-ia.ts
const APROVACAO_AUTOMATICA_IA = "IA (aprovação automática)";
const MOTIVO_APROVACAO_AUTOMATICA_IA =
  "Aprovado automaticamente: a IA aprovou este documento (backfill retroativo, ver commit d594d1c).";

async function main() {
  const documentoRepository = new PrismaDocumentoRepository(prisma);

  const documentosPendentesAprovadosPelaIa = await prisma.documento.findMany({
    where: { status: "PENDENTE", analiseIa: { parecer: "APROVADO" } },
    select: { id: true, agenciaId: true, tipo: true, representanteLegalId: true },
  });

  console.warn(
    `Encontrados ${documentosPendentesAprovadosPelaIa.length} documento(s) PENDENTE(s) com parecer da IA = APROVADO.`,
  );

  for (const documento of documentosPendentesAprovadosPelaIa) {
    await documentoRepository.atualizarStatus(documento.id, {
      status: "APROVADO",
      verificado: true,
      aprovadoPor: APROVACAO_AUTOMATICA_IA,
      motivoAprovacao: MOTIVO_APROVACAO_AUTOMATICA_IA,
      aprovadoEm: new Date(),
      reprovadoPor: null,
      motivoReprovacao: null,
      reprovadoEm: null,
    });
    console.warn(
      `OK: documento ${documento.id} (agencia ${documento.agenciaId}, tipo ${documento.tipo}${
        documento.representanteLegalId ? `, sócio ${documento.representanteLegalId}` : ""
      }) -> APROVADO`,
    );
  }

  console.warn(
    `Concluído: ${documentosPendentesAprovadosPelaIa.length} documento(s) corrigido(s).`,
  );
}

main()
  .catch((error) => {
    console.error("Falha no backfill:", error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

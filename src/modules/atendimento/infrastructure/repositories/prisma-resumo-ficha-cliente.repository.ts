import { StatusDocumento, type PrismaClient } from "@prisma/client";
import type { ResumoFichaClienteRepository } from "@/modules/atendimento/domain/repositories/resumo-ficha-cliente-repository";
import type {
  DocumentoParaRevisarEntity,
  ResumoFichaClienteEntity,
} from "@/modules/atendimento/domain/entities/conversa.entity";

function statusAgenciaToResumo(status: string): ResumoFichaClienteEntity["statusAgencia"] {
  if (status === "ativo") return "ativo";
  if (status === "recusado") return "recusado";
  return "em_andamento";
}

// Leitura read-only cruzando o que já existe no módulo cadastro
// (Agencia/Documento/DadosReceita/Contrato) — sem tabela própria. Não há
// fonte de dado nenhuma pra AMAT/SOFIA no schema atual, então
// `amatSofiaConsultado` fica sempre false até essa integração existir.
export class PrismaResumoFichaClienteRepository implements ResumoFichaClienteRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async obterResumo(agenciaId: string): Promise<ResumoFichaClienteEntity> {
    const [
      agencia,
      documentosAprovados,
      documentosPendentes,
      contratoRecente,
      dadosReceita,
      documentosParaRevisar,
    ] = await Promise.all([
      this.prisma.agencia.findUnique({ where: { id: agenciaId }, select: { status: true } }),
      this.prisma.documento.count({
        where: { agenciaId, status: StatusDocumento.APROVADO },
      }),
      this.prisma.documento.count({
        where: { agenciaId, status: StatusDocumento.PENDENTE },
      }),
      this.prisma.contrato.findFirst({
        where: { agenciaId },
        orderBy: { createdAt: "desc" },
        select: { status: true },
      }),
      this.prisma.dadosReceita.findUnique({
        where: { agenciaId },
        select: { situacaoCadastral: true },
      }),
      this.documentosAtuaisParaRevisar(agenciaId),
    ]);

    const statusAgencia = agencia ? statusAgenciaToResumo(agencia.status) : "em_andamento";
    // Uma agência "ativo" já passou por toda revisão que precisava —
    // linhas de Documento esquecidas em PENDENTE (ex.: cadastro aprovado
    // direto pela IA, sem revisão manual documento a documento via
    // AprovarDocumentoUseCase) não são uma pendência real: `status` do
    // Prisma default é PENDENTE, então uma linha nunca tocada por um
    // analista fica assim pra sempre, mesmo o cadastro estando resolvido.
    // Sem isso, o painel do /atendimento mostrava "2 pendente(s)" e o
    // bloco de reenvio de documento numa agência já aprovada e ativa.
    const agenciaAtiva = statusAgencia === "ativo";

    return {
      statusAgencia,
      documentosAprovados,
      documentosPendentes: agenciaAtiva ? 0 : documentosPendentes,
      documentosParaRevisar: agenciaAtiva ? [] : documentosParaRevisar,
      situacaoCadastralReceita: dadosReceita?.situacaoCadastral ?? null,
      contratoStatus: contratoRecente?.status ?? null,
      amatSofiaConsultado: false,
    };
  }

  // Documento atual de cada slot (tipo + representanteLegalId) que ainda
  // precisa de ação — reenvio cria uma linha NOVA em vez de sobrescrever a
  // reprovada (ver reenviar-documento.use-case.ts), então contar
  // REPROVADO ingenuamente incluiria reprovações antigas já superadas.
  // Dedup por slot igual ao dossiê (documentoAtual em prisma-agencia.repository).
  private async documentosAtuaisParaRevisar(
    agenciaId: string,
  ): Promise<DocumentoParaRevisarEntity[]> {
    const todos = await this.prisma.documento.findMany({
      where: { agenciaId },
      orderBy: { createdAt: "desc" },
      include: { representanteLegal: { select: { nome: true } } },
    });

    const vistos = new Set<string>();
    const atuais = todos.filter((documento) => {
      const chaveSlot = `${documento.tipo}:${documento.representanteLegalId ?? ""}`;
      if (vistos.has(chaveSlot)) return false;
      vistos.add(chaveSlot);
      return true;
    });

    return atuais
      .filter(
        (documento): documento is typeof documento & { status: "PENDENTE" | "REPROVADO" } =>
          documento.status === StatusDocumento.PENDENTE ||
          documento.status === StatusDocumento.REPROVADO,
      )
      .map((documento) => ({
        id: documento.id,
        tipo: documento.tipo,
        status: documento.status,
        nomeSocio: documento.representanteLegal?.nome ?? null,
        motivoReprovacao: documento.motivoReprovacao,
      }));
  }
}

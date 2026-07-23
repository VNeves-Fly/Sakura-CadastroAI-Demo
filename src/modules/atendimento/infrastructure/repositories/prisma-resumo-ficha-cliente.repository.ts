import { StatusDocumento, type PrismaClient } from "@prisma/client";
import type { ResumoFichaClienteRepository } from "@/modules/atendimento/domain/repositories/resumo-ficha-cliente-repository";
import type { ResumoFichaClienteEntity } from "@/modules/atendimento/domain/entities/conversa.entity";

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
    const [agencia, documentosAprovados, documentosPendentes, contratoRecente, dadosReceita] =
      await Promise.all([
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
      ]);

    return {
      statusAgencia: agencia ? statusAgenciaToResumo(agencia.status) : "em_andamento",
      documentosAprovados,
      documentosPendentes,
      situacaoCadastralReceita: dadosReceita?.situacaoCadastral ?? null,
      contratoStatus: contratoRecente?.status ?? null,
      amatSofiaConsultado: false,
    };
  }
}

import type { UseCase } from "@/modules/shared/application/use-case";
import { NotFoundError } from "@/modules/shared/domain/errors";
import type {
  AgenciaDetalhe,
  AgenciaRepository,
  FonteConsultaCredito,
} from "@/modules/cadastro/domain/repositories/agencia-repository";
import type {
  AnaliseIaRawData,
  AnaliseIaRawToolCall,
  AnaliseIaResultado,
  AnaliseIaService,
  AnaliseIaStage2,
} from "@/modules/cadastro/domain/services/analise-ia-service";
import type { DocumentAnalysisResultado } from "@/modules/cadastro/domain/services/document-analysis-service";
import type {
  SofiaConsultaResultado,
  SofiaConsultaService,
} from "@/modules/cadastro/domain/services/sofia-consulta-service";

export interface ReconsultarCreditoInput {
  agenciaId: string;
  fonte: FonteConsultaCredito;
  consultadoPor: string;
}

// RG/CNH não entra nessa chamada: o agente usa nome/CPF/data de nascimento
// dos sócios pra decidir quem consultar no AMAT (ver comentário em
// FlysakuraAnaliseIaAdapter) — os campos de documento só alimentam o
// cruzamento documental (stage1/stage3), que essa reconsulta não usa.
const RG_ANALISE_VAZIA: DocumentAnalysisResultado = {
  camposExtraidos: {},
  camposExtras: {},
  confiancaExtracao: 0,
  alertas: [],
  resumoAnalise: null,
  textoBruto: null,
  checagens: null,
};

function toIsoDate(data: Date | null): string {
  return data ? data.toISOString().slice(0, 10) : "";
}

// Normaliza a resposta do endpoint direto de SOFIA (GET /api/v1/sofia/, ver
// FlysakuraSofiaConsultaAdapter) pra convenção que ConsultaSofiaCard já lê
// (varianteSofia): dict com `status` — "NAO_CONSTA" fica verde, qualquer
// outro valor fica vermelho. `records[].status` é um código interno do
// provedor (ex.: 1, sem relação com essa convenção) — renomeado pra
// `statusRegistro` só na versão resumida, pra não colidir; o valor original
// intacto continua disponível em "Chamadas brutas" (ver rawSofia abaixo).
function normalizarSofiaDireto(resultado: SofiaConsultaResultado): Record<string, unknown> {
  if (resultado.records.length === 0) {
    return { status: "NAO_CONSTA" };
  }
  if (resultado.records.length === 1) {
    const { status: statusRegistro, ...campos } = resultado.records[0]!;
    return { status: "CONSTA", ...campos, statusRegistro };
  }
  return { status: "CONSTA", total: resultado.total, registros: resultado.records };
}

// Reconsulta manual de AMAT ou SOFIA disparada pelo analista a partir do
// dossiê (ConsultaAmatCard/ConsultaSofiaCard) — deliberadamente separada
// de AnalisarCadastroUseCase: não reanalisa documentos, não gera/reenvia
// contrato e nunca move Agencia.status, só atualiza a seção de crédito
// (stage2/rawData) e grava a auditoria em HistoricoConsultaCredito.
//
// AMAT: o agente externo (agents.flysakura.com) só expõe AMAT dentro da
// chamada combinada de análise (não existe flag "verificar_amat" isolado
// sem o resto) — por isso a reconsulta de AMAT ainda dispara
// analiseIaService.avaliar() por completo, e o stage2/rawData "atual" da
// agência é sobrescrito integralmente (os dois valores vêm frescos de
// qualquer forma).
//
// SOFIA: desde 2026-07-27 existe um endpoint dedicado
// (FlysakuraSofiaConsultaAdapter, GET /api/v1/sofia/) que consulta só isso,
// sem rodar o pipeline de análise inteiro. Por isso essa reconsulta usa o
// SofiaConsultaService isolado — e, como ele não devolve AMAT/processos/
// reclamações, o stage2/rawData gravado PRESERVA o que já existia pra
// essas seções (só a fatia `sofia` é substituída pelo dado fresco).
export class ReconsultarCreditoUseCase implements UseCase<ReconsultarCreditoInput, void> {
  constructor(
    private readonly agenciaRepository: AgenciaRepository,
    private readonly analiseIaService: AnaliseIaService,
    private readonly sofiaConsultaService: SofiaConsultaService,
  ) {}

  async execute({ agenciaId, fonte, consultadoPor }: ReconsultarCreditoInput): Promise<void> {
    const detalhe = await this.agenciaRepository.obterDetalhe(agenciaId);
    if (!detalhe) {
      throw new NotFoundError(`Agência não encontrada (agenciaId=${agenciaId}).`);
    }

    if (fonte === "SOFIA") {
      await this.reconsultarSofia(detalhe, consultadoPor);
      return;
    }

    await this.reconsultarAmat(detalhe, consultadoPor);
  }

  private async reconsultarAmat(detalhe: AgenciaDetalhe, consultadoPor: string): Promise<void> {
    const { agencia, representantesLegais } = detalhe;

    let resultado: AnaliseIaResultado;
    try {
      resultado = await this.analiseIaService.avaliar({
        cnpj: agencia.cnpj,
        razaoSocial: agencia.razaoSocial,
        email: agencia.emailContato,
        socios: representantesLegais.map((socio) => ({
          nome: socio.nome,
          cpf: socio.cpf,
          dataNascimento: toIsoDate(socio.dataNascimento),
          rgPath: socio.rg?.gcsPath ?? "",
          rgAnalise: RG_ANALISE_VAZIA,
        })),
      });
    } catch (error) {
      await this.agenciaRepository.registrarConsultaCredito(agencia.id, {
        fonte: "AMAT",
        sucesso: false,
        erro: `Falha técnica na reconsulta: ${String(error)}`,
        stage2: null,
        rawData: null,
        consultadoPor,
      });
      return;
    }

    await this.agenciaRepository.registrarConsultaCredito(agencia.id, {
      fonte: "AMAT",
      sucesso: true,
      erro: null,
      stage2: resultado.stage2 ?? null,
      rawData: resultado.rawData ?? null,
      consultadoPor,
    });
  }

  private async reconsultarSofia(detalhe: AgenciaDetalhe, consultadoPor: string): Promise<void> {
    const { agencia } = detalhe;
    const stage2Atual = detalhe.analiseIa?.stage2 ?? null;
    const rawDataAtual = detalhe.analiseIa?.rawData ?? null;

    let resultadoSofia: SofiaConsultaResultado;
    try {
      resultadoSofia = await this.sofiaConsultaService.consultarPorCnpj(agencia.cnpj);
    } catch (error) {
      await this.agenciaRepository.registrarConsultaCredito(agencia.id, {
        fonte: "SOFIA",
        sucesso: false,
        erro: `Falha técnica na reconsulta: ${String(error)}`,
        stage2: null,
        rawData: null,
        consultadoPor,
      });
      return;
    }

    const stage2: AnaliseIaStage2 = {
      amat: stage2Atual?.amat ?? null,
      sofia: normalizarSofiaDireto(resultadoSofia),
      processosJudiciais: stage2Atual?.processosJudiciais ?? null,
      reclamacoes: stage2Atual?.reclamacoes ?? null,
      debtTotal: stage2Atual?.debtTotal ?? null,
    };

    const chamadaSofia: AnaliseIaRawToolCall = {
      tool: "sofia_consulta_direta",
      args: { cnpj: agencia.cnpj },
      output: resultadoSofia,
    };
    const rawData: AnaliseIaRawData = {
      ...rawDataAtual,
      sofia: [chamadaSofia],
    };

    await this.agenciaRepository.registrarConsultaCredito(agencia.id, {
      fonte: "SOFIA",
      sucesso: true,
      erro: null,
      stage2,
      rawData,
      consultadoPor,
    });
  }
}

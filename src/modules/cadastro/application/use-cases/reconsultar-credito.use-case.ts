import type { UseCase } from "@/modules/shared/application/use-case";
import { NotFoundError } from "@/modules/shared/domain/errors";
import type {
  AgenciaRepository,
  FonteConsultaCredito,
} from "@/modules/cadastro/domain/repositories/agencia-repository";
import type {
  AnaliseIaService,
  AnaliseIaResultado,
} from "@/modules/cadastro/domain/services/analise-ia-service";
import type { DocumentAnalysisResultado } from "@/modules/cadastro/domain/services/document-analysis-service";

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

// Reconsulta manual de AMAT ou SOFIA disparada pelo analista a partir do
// dossiê (ConsultaAmatCard/ConsultaSofiaCard) — deliberadamente separada
// de AnalisarCadastroUseCase: não reanalisa documentos, não gera/reenvia
// contrato e nunca move Agencia.status, só atualiza a seção de crédito
// (stage2/rawData) e grava a auditoria em HistoricoConsultaCredito.
//
// Limitação de origem: o agente externo (agents.flysakura.com) expõe uma
// única chamada que devolve AMAT e SOFIA juntos — não existe um flag
// "verificar_sofia" isolado (só "verificar_amat"). Por isso as duas ações
// aqui fazem a MESMA chamada; o que muda é qual metade do resultado vira
// linha de histórico (`fonte`) — mas o stage2/rawData "atual" da agência é
// sempre atualizado por completo, já que os dois valores vieram frescos
// de qualquer forma.
export class ReconsultarCreditoUseCase implements UseCase<ReconsultarCreditoInput, void> {
  constructor(
    private readonly agenciaRepository: AgenciaRepository,
    private readonly analiseIaService: AnaliseIaService,
  ) {}

  async execute({ agenciaId, fonte, consultadoPor }: ReconsultarCreditoInput): Promise<void> {
    const detalhe = await this.agenciaRepository.obterDetalhe(agenciaId);
    if (!detalhe) {
      throw new NotFoundError(`Agência não encontrada (agenciaId=${agenciaId}).`);
    }

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
      await this.agenciaRepository.registrarConsultaCredito(agenciaId, {
        fonte,
        sucesso: false,
        erro: `Falha técnica na reconsulta: ${String(error)}`,
        stage2: null,
        rawData: null,
        consultadoPor,
      });
      return;
    }

    await this.agenciaRepository.registrarConsultaCredito(agenciaId, {
      fonte,
      sucesso: true,
      erro: null,
      stage2: resultado.stage2 ?? null,
      rawData: resultado.rawData ?? null,
      consultadoPor,
    });
  }
}

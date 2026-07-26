import type { UseCase } from "@/modules/shared/application/use-case";
import { ConflictError } from "@/modules/shared/domain/errors";
import {
  STATUS_EM_ANALISE,
  STATUS_AGUARDANDO_ASSINATURA,
  STATUS_EM_COMPLEMENTAR,
  type AgenciaRepository,
} from "@/modules/cadastro/domain/repositories/agencia-repository";
import type { DadosReceitaRepository } from "@/modules/cadastro/domain/repositories/dados-receita-repository";
import type { DadosReceitaEndereco } from "@/modules/cadastro/domain/entities/dados-receita.entity";
import type {
  ContratoAssinaturaService,
  GerarContratoEndereco,
} from "@/modules/cadastro/domain/services/contrato-assinatura-service";
import type {
  AnaliseIaResultado,
  AnaliseIaService,
} from "@/modules/cadastro/domain/services/analise-ia-service";
import type {
  DocumentAnalysisResultado,
  DocumentAnalysisService,
} from "@/modules/cadastro/domain/services/document-analysis-service";

export interface AnalisarCadastroInput {
  agenciaId: string;
}

const ENDERECO_VAZIO: GerarContratoEndereco = {
  cep: "",
  logradouro: "",
  numero: "",
  complemento: "",
  bairro: "",
  cidade: "",
  uf: "",
};

const ANALISE_VAZIA: DocumentAnalysisResultado = {
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

// Mesma normalização usada em analisar-contrato-social.use-case.ts —
// capital social pode vir como número ou string em formato BR ("100.000,00").
function extrairCapitalSocial(valor: unknown): number | null {
  if (typeof valor === "number" && Number.isFinite(valor)) return valor;
  if (typeof valor !== "string") return null;

  const normalizado = valor.replace(/\./g, "").replace(",", ".");
  const numero = Number(normalizado);
  return Number.isFinite(numero) ? numero : null;
}

function extrairString(valor: unknown): string | null {
  return typeof valor === "string" && valor.length > 0 ? valor : null;
}

// `endereco` do contrato social é um objeto confirmado no schema do agente
// (cep/logradouro/numero/complemento/bairro/municipio/uf) — mapeia pro
// shape de DadosReceitaEndereco (campo "cidade", não "municipio").
function extrairEnderecoContratoSocial(valor: unknown): DadosReceitaEndereco | null {
  if (typeof valor !== "object" || valor === null) return null;
  const registro = valor as Record<string, unknown>;

  const endereco: DadosReceitaEndereco = {
    cep: extrairString(registro.cep),
    logradouro: extrairString(registro.logradouro),
    numero: extrairString(registro.numero),
    complemento: extrairString(registro.complemento),
    bairro: extrairString(registro.bairro),
    cidade: extrairString(registro.municipio),
    uf: extrairString(registro.uf),
  };

  const temAlgumCampo = Object.values(endereco).some((campo) => campo !== null);
  return temAlgumCampo ? endereco : null;
}

// Roda em background, disparado (fire-and-forget) pela rota logo após
// FinalizarCadastroUseCase persistir a Agência com status "em_analise" —
// refaz a partir do que já está no banco (obterDetalhe), não recebe o
// payload do wizard diretamente. Isso o torna reentrante: pode ser
// chamado de novo pra reprocessar um cadastro travado (ver
// reprocessarAnalise no admin), já que registrarAnaliseDocumento/
// registrarAnaliseFinal são upsert.
//
// Qualquer falha aqui (rede, agente fora do ar, D4Sign indisponível)
// nunca deixa a Agência perdida: sempre converge pra "em_complementar"
// (fila de revisão manual existente), com o motivo técnico registrado em
// AnaliseIaAgencia.motivo e a causa classificada em
// AnaliseIaAgencia.resultado (ver ResultadoAnaliseIa) — REPROVADO (a IA
// avaliou de verdade e disse não), FALHA_ANALISE (a chamada de avaliação
// quebrou antes de produzir parecer) ou FALHA_CONTRATO (a IA aprovou, mas
// a geração/envio do contrato falhou) — pra o analista distinguir os três
// antes de decidir.
export class AnalisarCadastroUseCase implements UseCase<AnalisarCadastroInput, void> {
  constructor(
    private readonly agenciaRepository: AgenciaRepository,
    private readonly contratoAssinaturaService: ContratoAssinaturaService,
    private readonly analiseIaService: AnaliseIaService,
    private readonly documentAnalysisService: DocumentAnalysisService,
    private readonly dadosReceitaRepository: DadosReceitaRepository,
  ) {}

  async execute({ agenciaId }: AnalisarCadastroInput): Promise<void> {
    const detalhe = await this.agenciaRepository.obterDetalhe(agenciaId);

    if (!detalhe || !detalhe.contratoSocial) {
      console.error(
        `AnalisarCadastroUseCase: agência ou contrato social não encontrado (agenciaId=${agenciaId})`,
      );
      return;
    }

    const { agencia, complementar, representantesLegais, contratoSocial } = detalhe;

    // Só roda (ou reprocessa) enquanto a agência ainda está numa etapa que
    // depende da IA — evita que um reprocessamento indevido (link direto,
    // página em cache, chamada duplicada) sobrescreva o parecer e regrida
    // o status de uma agência que já avançou (aguardando_validacao, ativo
    // etc.), ou gere um segundo contrato real se já existir um.
    if (agencia.status !== STATUS_EM_ANALISE && agencia.status !== STATUS_EM_COMPLEMENTAR) {
      throw new ConflictError(
        `Cadastro não está em uma etapa que aceita (re)análise de IA (status atual: ${agencia.status}).`,
      );
    }

    // Tolerante a falha por design (ver FlysakuraDocumentAnalysisAdapter) —
    // nunca lança, só devolve um resultado vazio quando o agente falha.
    const analiseIaContratoSocial = await this.documentAnalysisService.analisar({
      cnpj: agencia.cnpj,
      documentPath: contratoSocial.gcsPath,
      documentType: "contrato_social",
    });
    await this.agenciaRepository.registrarAnaliseDocumento(
      contratoSocial.id,
      analiseIaContratoSocial,
    );

    const analisesPorSocioId = new Map<string, DocumentAnalysisResultado>();
    for (const socio of representantesLegais) {
      const analise = socio.rg
        ? await this.documentAnalysisService.analisar({
            cnpj: agencia.cnpj,
            documentPath: socio.rg.gcsPath,
            documentType: "doc_identificacao",
          })
        : ANALISE_VAZIA;

      if (socio.rg) {
        await this.agenciaRepository.registrarAnaliseDocumento(socio.rg.id, analise);
      }
      analisesPorSocioId.set(socio.id, analise);
    }

    let analiseIa: AnaliseIaResultado;
    try {
      analiseIa = await this.analiseIaService.avaliar({
        cnpj: agencia.cnpj,
        razaoSocial: agencia.razaoSocial,
        email: agencia.emailContato,
        socios: representantesLegais.map((socio) => ({
          nome: socio.nome,
          cpf: socio.cpf,
          dataNascimento: toIsoDate(socio.dataNascimento),
          rgPath: socio.rg?.gcsPath ?? "",
          rgAnalise: analisesPorSocioId.get(socio.id) ?? ANALISE_VAZIA,
        })),
      });
    } catch (error) {
      await this.agenciaRepository.registrarAnaliseFinal(
        agenciaId,
        { aprovado: false, motivo: `Falha técnica na análise automática: ${String(error)}` },
        STATUS_EM_COMPLEMENTAR,
        "FALHA_ANALISE",
      );
      return;
    }

    if (analiseIa.aprovado) {
      // `administrativo === false` é a única marca que exclui um sócio da
      // lista de signatarios — null (IA não avaliou) e true assinam (ver
      // RepresentanteLegal.administrativo no schema).
      const signatarios = representantesLegais
        .filter((socio) => socio.administrativo !== false)
        .map((socio) => ({
          nome: socio.nome,
          email: socio.email,
          cpf: socio.cpf,
        }));

      try {
        const contratoResult = await this.contratoAssinaturaService.gerarEEnviar({
          cnpj: agencia.cnpj,
          razaoSocial: agencia.razaoSocial,
          origem: agencia.origem,
          endereco: complementar?.enderecoAgencia ?? ENDERECO_VAZIO,
          signatarios,
        });

        await this.agenciaRepository.criarContrato(agenciaId, {
          provedorId: contratoResult.provedorId,
          status: contratoResult.status,
          origemGeracao: "ia",
          signatarios,
        });
        await this.agenciaRepository.registrarAnaliseFinal(
          agenciaId,
          analiseIa,
          STATUS_AGUARDANDO_ASSINATURA,
          "APROVADO",
        );
      } catch (error) {
        // IA aprovou, mas o contrato não pôde ser gerado/enviado (D4Sign
        // fora do ar etc.) — não perde o veredito da IA, só cai pra fila
        // manual com o motivo técnico anexado; o analista pode aprovar de
        // novo manualmente (AprovarCadastroComplementarUseCase reenvia o
        // contrato do zero).
        await this.agenciaRepository.registrarAnaliseFinal(
          agenciaId,
          {
            ...analiseIa,
            motivo:
              `IA aprovou, mas a geração do contrato falhou: ${String(error)}` +
              (analiseIa.motivo ? ` — ${analiseIa.motivo}` : ""),
          },
          STATUS_EM_COMPLEMENTAR,
          "FALHA_CONTRATO",
        );
      }
    } else {
      await this.agenciaRepository.registrarAnaliseFinal(
        agenciaId,
        analiseIa,
        STATUS_EM_COMPLEMENTAR,
        "REPROVADO",
      );
    }

    // Cache normalizado pro dossiê do painel admin ("Dados da Receita") —
    // best-effort: a agência já está persistida, então uma falha aqui
    // nunca deve interromper o fluxo, só fica sem esse dado suplementar.
    // Mesma lógica que existia em FinalizarCadastroUseCase antes desta
    // refatoração — só passou a checar se já existe (findByAgenciaId) pra
    // ser seguro em caso de reprocessamento.
    const capitalSocial = extrairCapitalSocial(
      analiseIaContratoSocial.camposExtraidos.capital_social,
    );
    const endereco = extrairEnderecoContratoSocial(
      analiseIaContratoSocial.camposExtraidos.endereco,
    );
    const situacaoCadastral = analiseIa.stage1?.situacaoCadastral ?? null;

    if (situacaoCadastral || capitalSocial !== null || endereco) {
      try {
        const dados = {
          situacaoCadastral,
          dataAbertura: null,
          naturezaJuridica: null,
          porte: null,
          capitalSocial,
          telefone: null,
          email: null,
          optanteSimples: false,
          dataOpcaoSimples: null,
          endereco,
          cnaes: [],
        };
        const existente = await this.dadosReceitaRepository.findByAgenciaId(agenciaId);
        if (existente) {
          await this.dadosReceitaRepository.update(agenciaId, dados);
        } else {
          await this.dadosReceitaRepository.create({ agenciaId, ...dados });
        }
      } catch (error) {
        console.warn(
          `Falha ao persistir Dados da Receita (agenciaId=${agenciaId}): ${String(error)}`,
        );
      }
    }
  }
}

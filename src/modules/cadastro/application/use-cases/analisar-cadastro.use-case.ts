import type { UseCase } from "@/modules/shared/application/use-case";
import { ConflictError } from "@/modules/shared/domain/errors";
import {
  STATUS_EM_ANALISE,
  STATUS_AGUARDANDO_ASSINATURA,
  STATUS_EM_COMPLEMENTAR,
  type AgenciaRepository,
} from "@/modules/cadastro/domain/repositories/agencia-repository";
import type { DadosReceitaRepository } from "@/modules/cadastro/domain/repositories/dados-receita-repository";
import type {
  DadosReceitaCnae,
  DadosReceitaEndereco,
} from "@/modules/cadastro/domain/entities/dados-receita.entity";
import type {
  ContratoAssinaturaService,
  GerarContratoEndereco,
} from "@/modules/cadastro/domain/services/contrato-assinatura-service";
import type {
  AnaliseIaCnaePrincipal,
  AnaliseIaRawData,
  AnaliseIaResultado,
  AnaliseIaService,
} from "@/modules/cadastro/domain/services/analise-ia-service";
import type {
  DocumentAnalysisResultado,
  DocumentAnalysisService,
} from "@/modules/cadastro/domain/services/document-analysis-service";
import type { Documento } from "@/modules/cadastro/domain/entities/documento.entity";
import type { DocumentoRepository } from "@/modules/cadastro/domain/repositories/documento-repository";
import type { SstService } from "@/modules/cadastro/domain/services/sst-service";
import type { ContratoAssinaturaRepository } from "@/modules/cadastro/domain/repositories/contrato-assinatura-repository";
import { persistirKeySigners } from "@/modules/cadastro/domain/services/assinatura-socios.util";

// Mesma convenção de "quem" usada em AuditoriaDocumento (dossie-campos.tsx)
// pra distinguir aprovação humana de automática — quem consultou tem
// mais contexto do que um valor nulo silencioso.
const APROVACAO_AUTOMATICA_IA = "IA (aprovação automática)";
const MOTIVO_APROVACAO_AUTOMATICA_IA =
  "Aprovado automaticamente: a IA aprovou o cadastro por completo, sem passar por revisão manual documento a documento.";

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

// CNPJ ausente no corpo do Contrato Social é comum e aceitável (contratos
// sociais de constituição, redigidos antes da emissão do cartão CNPJ) —
// o próprio agente externo já reconhece isso na narrativa (resumoAnalise),
// mas ainda reprova por "campo obrigatório ausente" (checagem de schema),
// uma contradição que não fundamenta reprovação de verdade (decisão do
// usuário, 2026-07-27). Só sobrescreve quando ESSE é o único motivo real —
// `alertas` mistura observações informativas ("Info: ...", vindas de
// `data.observations`) com erros de verdade ("Erro: ...", prefixo que o
// próprio FlysakuraDocumentAnalysisAdapter adiciona a partir de
// `data.errors`) — só os "Erro:" contam como motivo de bloqueio; qualquer
// outro erro real (ex.: assinatura ausente) continua reprovando normalmente.
function corrigirFalsoPositivoCnpjAusente(
  resultado: DocumentAnalysisResultado,
): DocumentAnalysisResultado {
  if (resultado.parecer !== "REPROVADO") return resultado;

  const erros = resultado.alertas.filter((alerta) => alerta.startsWith("Erro:"));
  const errosCnpj = erros.filter((erro) => /cnpj/i.test(erro));
  const outrosErros = erros.filter((erro) => !/cnpj/i.test(erro));
  if (errosCnpj.length === 0 || outrosErros.length > 0) return resultado;

  return { ...resultado, parecer: "APROVADO" };
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

// Mesmo shape em ambas as fontes que alimentam isso (cep/logradouro/
// numero/complemento/bairro/municipio/uf): o schema do agente pro
// contrato social e o `endereco` da consulta oficial de CNPJ (ver
// extrairDadosOficiaisReceita) — mapeia pro shape de DadosReceitaEndereco
// (campo "cidade", não "municipio").
function extrairEndereco(valor: unknown): DadosReceitaEndereco | null {
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

// Junta principal + secundários do stage1 (comparação da IA) numa lista
// plana pro cache de Dados da Receita — mesma fonte que já alimenta
// CnaesStage1Detalhe no dossiê, só que persistida (sobrevive a reconsultas
// sem stage1 e a cadastros arquivados). `compativelTurismo` fica pra trás
// de propósito: é um julgamento do agente sobre o cadastro específico, não
// um dado da Receita.
function extrairCnaes(
  cnaePrincipal: AnaliseIaCnaePrincipal | null,
  cnaesSecundarios: AnaliseIaCnaePrincipal[],
): DadosReceitaCnae[] {
  const cnaes: DadosReceitaCnae[] = [];
  if (cnaePrincipal) {
    cnaes.push({
      codigo: cnaePrincipal.codigo,
      descricao: cnaePrincipal.descricao,
      principal: true,
    });
  }
  for (const secundario of cnaesSecundarios) {
    cnaes.push({
      codigo: secundario.codigo,
      descricao: secundario.descricao,
      principal: false,
    });
  }
  return cnaes;
}

// A tool "fetch_official_cnpj" (fonte "receita" em rawData, ver
// AnaliseIaRawToolCall) é a resposta crua do provedor (SERPRO) — a única
// fonte hoje pra data_abertura/natureza_juridica/telefone/email de Dados
// da Receita (sem isso esses campos ficavam sempre null). `output` é
// `unknown` porque o shape de cada tool call varia por fonte — checado na
// unha aqui em vez de confiar num tipo. Pega a primeira chamada com
// sucesso; se a tool falhou ou não rodou (cadastro antigo, ou
// `include_raw_data` não mandado), devolve null e os campos ficam
// ausentes, igual antes.
function extrairDadosOficiaisReceita(
  rawData: AnaliseIaRawData | null | undefined,
): Record<string, unknown> | null {
  const chamadas = rawData?.receita;
  if (!Array.isArray(chamadas)) return null;

  for (const chamada of chamadas) {
    if (typeof chamada.output !== "object" || chamada.output === null) continue;
    const { data, status } = chamada.output as Record<string, unknown>;
    if (status !== "success") continue;
    if (typeof data !== "object" || data === null) continue;
    return data as Record<string, unknown>;
  }
  return null;
}

function extrairDataIso(valor: unknown): Date | null {
  if (typeof valor !== "string" || valor.length === 0) return null;
  const data = new Date(valor);
  return Number.isNaN(data.getTime()) ? null : data;
}

// `atividade_principal`/`atividades_secundarias` da consulta oficial usam
// code/text (em vez de codigo/descricao do stage1, ver extrairCnaes) —
// preferida quando presente por ser a fonte bruta da Receita (sempre que a
// tool roda), com o resumo do stage1 como fallback pra cadastros
// processados antes dessa tool existir.
function extrairCnaesOficiais(dadosOficiais: Record<string, unknown> | null): DadosReceitaCnae[] {
  if (!dadosOficiais) return [];

  const cnaes: DadosReceitaCnae[] = [];
  const principal = Array.isArray(dadosOficiais.atividade_principal)
    ? dadosOficiais.atividade_principal[0]
    : null;
  if (typeof principal === "object" && principal !== null) {
    const registro = principal as Record<string, unknown>;
    cnaes.push({
      codigo: extrairString(registro.code),
      descricao: extrairString(registro.text),
      principal: true,
    });
  }

  const secundarias = Array.isArray(dadosOficiais.atividades_secundarias)
    ? dadosOficiais.atividades_secundarias
    : [];
  for (const item of secundarias) {
    if (typeof item !== "object" || item === null) continue;
    const registro = item as Record<string, unknown>;
    cnaes.push({
      codigo: extrairString(registro.code),
      descricao: extrairString(registro.text),
      principal: false,
    });
  }

  return cnaes;
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
    private readonly documentoRepository: DocumentoRepository,
    private readonly sstService: SstService,
    private readonly contratoAssinaturaRepository: ContratoAssinaturaRepository,
  ) {}

  // A IA aprovando um documento (contrato social ou RG de um sócio) não
  // passa por AprovarDocumentoUseCase — sem isso, Documento.status ficava
  // PENDENTE pra sempre (default do schema), mesmo com a IA já tendo
  // aprovado aquele documento específico, fazendo o dossiê mostrar
  // pendência (amarelo) que não existe de verdade (decisão do usuário,
  // 2026-07-27 e 2026-07-28). Chamado com só os documentos aprovados
  // individualmente pela IA — os reprovados (ou não avaliados) continuam
  // PENDENTE de propósito, sinalizando que o analista precisa revisar
  // justamente esses.
  private async aprovarDocumentosAutomaticamente(documentos: Documento[]): Promise<void> {
    await Promise.all(
      documentos.map((documento) =>
        this.documentoRepository.atualizarStatus(documento.id, {
          status: "APROVADO",
          verificado: true,
          aprovadoPor: APROVACAO_AUTOMATICA_IA,
          motivoAprovacao: MOTIVO_APROVACAO_AUTOMATICA_IA,
          aprovadoEm: new Date(),
          reprovadoPor: null,
          motivoReprovacao: null,
          reprovadoEm: null,
        }),
      ),
    );
  }

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

    // Checagem automática "essa empresa já está no SICA?" (SST) — um
    // cadastro novo normalmente não tem SICA ainda; achar algo aqui é
    // sinal de recadastro (a empresa já existia). Tolerante a falha, mesmo
    // espírito do documentAnalysisService logo abaixo: nunca bloqueia a
    // análise principal, só fica sem esse dado se o SST falhar (sempre
    // reconsultável depois, ver ConsultarSicaUseCase).
    try {
      const resultadoSst = await this.sstService.consultarSicaCNPJ(agencia.cnpj);
      await this.agenciaRepository.registrarConsultaSst(agenciaId, {
        sucesso: true,
        erro: null,
        metodo: "cnpj",
        resultado: resultadoSst,
        consultadoPor: null,
      });
    } catch (error) {
      await this.agenciaRepository.registrarConsultaSst(agenciaId, {
        sucesso: false,
        erro: String(error),
        metodo: "cnpj",
        resultado: null,
        consultadoPor: null,
      });
    }

    // Tolerante a falha por design (ver FlysakuraDocumentAnalysisAdapter) —
    // nunca lança, só devolve um resultado vazio quando o agente falha.
    const analiseIaContratoSocial = corrigirFalsoPositivoCnpjAusente(
      await this.documentAnalysisService.analisar({
        cnpj: agencia.cnpj,
        documentPath: contratoSocial.gcsPath,
        documentType: "contrato_social",
      }),
    );
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
        agencia.status,
        STATUS_EM_COMPLEMENTAR,
        "FALHA_ANALISE",
      );
      return;
    }

    // Gate adicional ao veredito agregado do agente (`analiseIa.aprovado`):
    // só segue pra geração de contrato quando TODOS os documentos também
    // foram aprovados individualmente (Contrato Social + RG de cada
    // sócio) — decisão do usuário, 2026-07-27: o agente já teve casos de
    // aprovar o cadastro no geral enquanto reprova um documento
    // específico na checagem por documento, uma contradição que não pode
    // silenciosamente seguir pra assinatura. Qualquer divergência cai
    // pra revisão manual (em_complementar), mesmo destino de uma
    // reprovação de verdade.
    const todosDocumentosAprovados =
      analiseIaContratoSocial.parecer === "APROVADO" &&
      representantesLegais.every(
        (socio) => analisesPorSocioId.get(socio.id)?.parecer === "APROVADO",
      );

    // Aprova documento a documento conforme o parecer individual da IA,
    // independente do veredito agregado — se a IA aprovou o Contrato
    // Social mas reprovou o RG de um sócio, o Contrato Social já vira
    // verde aqui, mesmo o cadastro caindo pra revisão manual no `else`
    // abaixo por causa só do RG.
    const documentosAprovadosPelaIa = [
      ...(analiseIaContratoSocial.parecer === "APROVADO" ? [contratoSocial] : []),
      ...representantesLegais
        .filter((socio) => socio.rg && analisesPorSocioId.get(socio.id)?.parecer === "APROVADO")
        .map((socio) => socio.rg as Documento),
    ];
    if (documentosAprovadosPelaIa.length > 0) {
      await this.aprovarDocumentosAutomaticamente(documentosAprovadosPelaIa);
    }

    if (analiseIa.aprovado && todosDocumentosAprovados) {
      // `administrativo === false` é a única marca que exclui um sócio da
      // lista de signatarios — null (IA não avaliou) e true assinam (ver
      // RepresentanteLegal.administrativo no schema).
      const signatarios = representantesLegais
        .filter((socio) => socio.administrativo !== false)
        .map((socio) => ({
          nome: socio.nome,
          email: socio.email,
          cpf: socio.cpf,
          rgNumero: socio.rgNumero,
          rgOrgaoEmissor: socio.rgOrgaoEmissor,
          nacionalidade: socio.nacionalidade,
          estadoCivil: socio.estadoCivil,
          dataNascimento: socio.dataNascimento,
          endereco: socio.endereco,
        }));

      try {
        const contratoResult = await this.contratoAssinaturaService.gerarEEnviar({
          cnpj: agencia.cnpj,
          razaoSocial: agencia.razaoSocial,
          endereco: complementar?.enderecoAgencia ?? ENDERECO_VAZIO,
          signatarios,
        });

        const contrato = await this.agenciaRepository.criarContrato(agenciaId, {
          provedorId: contratoResult.provedorId,
          status: contratoResult.status,
          origemGeracao: "ia",
          signatarios,
        });
        await persistirKeySigners(
          this.contratoAssinaturaRepository,
          contrato.id,
          contratoResult.signatariosKeySigner,
        );
        await this.agenciaRepository.registrarAnaliseFinal(
          agenciaId,
          analiseIa,
          agencia.status,
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
          agencia.status,
          STATUS_EM_COMPLEMENTAR,
          "FALHA_CONTRATO",
        );
      }
    } else {
      await this.agenciaRepository.registrarAnaliseFinal(
        agenciaId,
        analiseIa.aprovado && !todosDocumentosAprovados
          ? {
              ...analiseIa,
              motivo:
                "A IA aprovou o cadastro no geral, mas reprovou (ou não avaliou) ao menos um documento na checagem individual (Contrato Social ou RG de sócio) — revisão manual necessária." +
                (analiseIa.motivo ? ` — ${analiseIa.motivo}` : ""),
            }
          : analiseIa,
        agencia.status,
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
    const dadosOficiaisReceita = extrairDadosOficiaisReceita(analiseIa.rawData);

    const capitalSocial =
      extrairCapitalSocial(analiseIaContratoSocial.camposExtraidos.capital_social) ??
      extrairCapitalSocial(dadosOficiaisReceita?.capital_social);
    const endereco =
      extrairEndereco(analiseIaContratoSocial.camposExtraidos.endereco) ??
      extrairEndereco(dadosOficiaisReceita?.endereco);
    // Código bruto da Receita ("2", "8"...) não a string que
    // SituacaoCadastralBadge espera — segue vindo só do stage1 (já
    // resolvido pelo agente), de propósito não usa dadosOficiaisReceita
    // aqui.
    const situacaoCadastral = analiseIa.stage1?.situacaoCadastral ?? null;
    const dataAbertura = extrairDataIso(dadosOficiaisReceita?.data_abertura);
    const naturezaJuridica = extrairString(dadosOficiaisReceita?.natureza_juridica);
    const telefone = extrairString(dadosOficiaisReceita?.telefone);
    const email = extrairString(dadosOficiaisReceita?.email);
    const cnaesOficiais = extrairCnaesOficiais(dadosOficiaisReceita);
    const cnaes =
      cnaesOficiais.length > 0
        ? cnaesOficiais
        : extrairCnaes(
            analiseIa.stage1?.cnaePrincipal ?? null,
            analiseIa.stage1?.cnaesSecundarios ?? [],
          );

    if (
      situacaoCadastral ||
      capitalSocial !== null ||
      endereco ||
      cnaes.length > 0 ||
      dataAbertura ||
      naturezaJuridica ||
      telefone ||
      email
    ) {
      try {
        const dados = {
          situacaoCadastral,
          dataAbertura,
          naturezaJuridica,
          porte: null,
          capitalSocial,
          telefone,
          email,
          optanteSimples: false,
          dataOpcaoSimples: null,
          endereco,
          cnaes,
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

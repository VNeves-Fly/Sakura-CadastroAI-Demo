import type { Documento } from "@/modules/cadastro/domain/entities/documento.entity";
import type { TipoDocumento } from "@/modules/cadastro/domain/enums";
import type { AnaliseIaDocumento } from "@/modules/cadastro/domain/entities/analise-ia-documento.entity";
import type { SignatarioPadrao } from "@/modules/cadastro/domain/entities/signatario-padrao.entity";
import type { UsuarioMaster } from "@/modules/cadastro/domain/entities/usuario-master.entity";
import type {
  AnaliseIaDocumentoDetalhe,
  AnaliseIaStage1,
} from "@/modules/cadastro/domain/services/analise-ia-service";
import { ESTADO_CIVIL_OPCOES } from "@/modules/cadastro/types/socio-wizard.types";
import { maskCep } from "@/modules/cadastro/utils/cep.util";
import {
  TIPO_CONTA_OPCOES,
  BANCO_PAIS_OPCOES,
} from "@/modules/cadastro/types/endereco-banco.types";
import {
  STATUS_ATIVO,
  STATUS_AGUARDANDO_ASSINATURA,
  STATUS_AGUARDANDO_ATIVACAO,
  STATUS_AGUARDANDO_CADASTRAMENTO,
  STATUS_AGUARDANDO_VALIDACAO,
  STATUS_EM_COMPLEMENTAR,
  STATUS_RECUSADO,
  CONTRATO_STATUS_AGUARDANDO_ASSINATURA,
  CONTRATO_STATUS_ASSINADO_AGENCIA,
  CONTRATO_STATUS_ASSINADO,
  type RepresentanteLegalDetalhe,
  type AnaliseIaAgenciaDetalhe,
  type HistoricoConsultaCreditoItem,
} from "@/modules/cadastro/domain/repositories/agencia-repository";
import type {
  DocumentoRevisao,
  DocumentoHistoricoItem,
  SignatarioFila,
  AnaliseIaResumo,
  ParecerIaView,
  ParecerIaChecklistDocumento,
  ParecerIaChecklistGrupo,
  AnaliseCreditoView,
  HistoricoConsultaCreditoView,
} from "@/modules/admin/types/dossie.types";

// Traduz dado bruto do domínio (Agencia/Documento/enums) pra formato que
// a View do dossiê consome — nenhum desses cálculos deve viver dentro do
// componente de página ou dos componentes de apresentação.

export function labelOrigemContrato(origem: "ia" | "humano" | "externo" | null): string {
  if (origem === "ia") return "gerado pela IA";
  if (origem === "humano") return "gerado pelo analista";
  if (origem === "externo") return "registrado manualmente (assinado por fora)";
  return "origem desconhecida";
}

export function labelEstadoCivil(valor: string): string {
  return ESTADO_CIVIL_OPCOES.find((opcao) => opcao.valor === valor)?.label ?? valor;
}

export function labelTipoConta(valor: string): string {
  return TIPO_CONTA_OPCOES.find((opcao) => opcao.valor === valor)?.label ?? valor;
}

export function labelBancoPais(valor: string): string {
  return BANCO_PAIS_OPCOES.find((opcao) => opcao.valor === valor)?.label ?? valor;
}

export function formatarEndereco(endereco: {
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  uf: string;
}): string {
  if (!endereco.logradouro) return "—";
  const complemento = endereco.complemento ? `, ${endereco.complemento}` : "";
  const cep = endereco.cep ? `, ${maskCep(endereco.cep)}` : "";
  return `${endereco.logradouro}, ${endereco.numero || "s/n"}${complemento} — ${endereco.bairro}, ${endereco.cidade}/${endereco.uf}${cep}`;
}

// Documento real do banco (ou null, se a agência é anterior a essa
// tabela existir) -> item pronto pra tela de revisão. `historico` são as
// versões anteriores do MESMO slot (tipo + representanteLegalId), já
// resolvidas por historicoDoSlot — nunca inclui o próprio `documento`.
export function paraDocumentoRevisao(
  documento: Documento | null,
  label: string,
  historico: DocumentoHistoricoItem[] = [],
): DocumentoRevisao[] {
  if (!documento) return [];
  return [
    {
      id: documento.id,
      label,
      gcsPath: documento.gcsPath,
      status: documento.status,
      motivoReprovacao: documento.motivoReprovacao,
      historico,
    },
  ];
}

// Versões anteriores de um slot (tipo + representanteLegalId), mais
// recente primeiro — nunca inclui `idAtual` (o documento vigente do
// slot, já resolvido em obterDetalhe). `todosDocumentos` vem de
// listarDocumentos(agenciaId) (todas as linhas da agência, sem filtro de
// "atual"), reaproveitado só pra montar esse histórico — nenhuma query
// nova, o dado já existe no banco.
export function historicoDoSlot(
  todosDocumentos: Documento[],
  tipo: TipoDocumento,
  representanteLegalId: string | null,
  idAtual: string,
): DocumentoHistoricoItem[] {
  return todosDocumentos
    .filter(
      (documento) =>
        documento.tipo === tipo &&
        documento.representanteLegalId === representanteLegalId &&
        documento.id !== idAtual,
    )
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .map((documento) => ({
      id: documento.id,
      status: documento.status,
      motivoReprovacao: documento.motivoReprovacao,
      reprovadoPor: documento.reprovadoPor,
      reprovadoEm: documento.reprovadoEm,
      createdAt: documento.createdAt,
      gcsPath: documento.gcsPath,
    }));
}

const TIPOS_SLOT_FIXO = new Set<TipoDocumento>(["CONTRATO_SOCIAL", "RG_CNPJ", "PROCURACAO"]);

const LABEL_TIPO_DOCUMENTO_OUTRO: Record<string, string> = {
  CADASTUR: "Cadastur",
  COMPROVANTE_ENDERECO: "Comprovante de Endereço",
  COMPROVANTE_ENDERECO_AGENCIA: "Comprovante de Endereço da Agência",
  CERTIDAO_CASAMENTO: "Certidão de Casamento",
  OUTROS: "Outros",
};

// Documentos fora dos 3 slots fixos já exibidos em Empresa/Sócios (Contrato
// Social, RG/CNH, Procuração) — tipos "extra" (Cadastur, Comprovante de
// Endereço, Certidão de Casamento, Outros) que só existem via upload manual
// direto no arquivo (ver InserirDocumentoManualUseCase, chamado com
// `ignorarDocumentoVigente`/`aprovarAutomaticamente` a partir de
// /arquivo/[id]). Agrupado por slot (tipo + representanteLegalId): o mais
// recente é "o atual", o resto vira histórico — mesmo critério de
// historicoDoSlot acima, só que descobrindo os slots em vez de recebê-los
// prontos (aqui não existe uma lista fixa de "qual documento é o atual" pra
// consultar, como socio.rg/socio.procuracao).
export function paraDocumentosOutros(
  todosDocumentos: Documento[],
  representantesLegais: RepresentanteLegalDetalhe[],
): DocumentoRevisao[] {
  const nomePorSocioId = new Map(representantesLegais.map((socio) => [socio.id, socio.nome]));

  const grupos = new Map<string, Documento[]>();
  for (const documento of todosDocumentos) {
    if (TIPOS_SLOT_FIXO.has(documento.tipo)) continue;
    const chave = `${documento.tipo}|${documento.representanteLegalId ?? "agencia"}`;
    grupos.set(chave, [...(grupos.get(chave) ?? []), documento]);
  }

  return Array.from(grupos.values()).map((grupo) => {
    // Nunca vazio: só existe uma entrada em `grupos` quando pelo menos um
    // documento foi empurrado nela (ver loop acima).
    const [atual, ...resto] = [...grupo].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    ) as [Documento, ...Documento[]];
    const nomeSocio = atual.representanteLegalId
      ? (nomePorSocioId.get(atual.representanteLegalId) ?? null)
      : null;
    const rotuloBase =
      atual.tipo === "OUTROS"
        ? `Outros — ${atual.descricaoOutro ?? "sem descrição"}`
        : (LABEL_TIPO_DOCUMENTO_OUTRO[atual.tipo] ?? atual.tipo);

    return {
      id: atual.id,
      label: nomeSocio ? `${rotuloBase} — ${nomeSocio}` : rotuloBase,
      gcsPath: atual.gcsPath,
      status: atual.status,
      motivoReprovacao: atual.motivoReprovacao,
      historico: resto.map((documento) => ({
        id: documento.id,
        status: documento.status,
        motivoReprovacao: documento.motivoReprovacao,
        reprovadoPor: documento.reprovadoPor,
        reprovadoEm: documento.reprovadoEm,
        createdAt: documento.createdAt,
        gcsPath: documento.gcsPath,
      })),
    };
  });
}

// "Notificação" de reenvio pendente de revisão — sem tabela de
// notificação nova (a `Notificacao` do schema não é usada em lugar
// nenhum hoje): um documento avisa o analista quando está vigente
// (PENDENTE, ainda sem decisão) E tem pelo menos uma versão REPROVADA no
// histórico — ou seja, é uma resposta a uma reprovação anterior, não o
// envio original do cadastro.
export function documentosAguardandoRevisaoPosReenvio(
  documentosAtivos: DocumentoRevisao[],
): DocumentoRevisao[] {
  return documentosAtivos.filter(
    (documento) =>
      documento.status === "PENDENTE" &&
      documento.historico.some((item) => item.status === "REPROVADO"),
  );
}

// Quais documentos entram no rol "ativo" da ficha vs na lista de
// pendentes de reenvio — decisão baseada em status (dado), não em como
// a tela desenha cada bloco.
export function separarDocumentosPorStatus(documentos: DocumentoRevisao[]): {
  ativos: DocumentoRevisao[];
  pendentes: DocumentoRevisao[];
} {
  return {
    ativos: documentos.filter((doc) => doc.status !== "REPROVADO"),
    pendentes: documentos.filter((doc) => doc.status === "REPROVADO"),
  };
}

export const ETAPAS_PIPELINE = [
  { status: STATUS_EM_COMPLEMENTAR, label: "Complementar" },
  { status: STATUS_AGUARDANDO_ASSINATURA, label: "Assinatura" },
  { status: STATUS_AGUARDANDO_VALIDACAO, label: "Validação" },
  { status: STATUS_AGUARDANDO_CADASTRAMENTO, label: "SICA/TL" },
  { status: STATUS_AGUARDANDO_ATIVACAO, label: "Ativação" },
  { status: STATUS_ATIVO, label: "Ativo" },
];

// "Recusado" não é uma etapa da trilha (é uma saída do fluxo normal) —
// usa a existência de um Contrato como sinal real de onde a recusa
// aconteceu (com contrato = recusado depois de enviado; sem contrato =
// recusado ainda em Complementar) em vez de inventar um campo novo.
export function calcularProgressoTrilha(
  status: string,
  temContrato: boolean,
): { indiceAtual: number; recusado: boolean } {
  const recusado = status === STATUS_RECUSADO;
  const indiceAtual = recusado
    ? temContrato
      ? 1
      : 0
    : ETAPAS_PIPELINE.findIndex((etapa) => etapa.status === status);

  return { indiceAtual, recusado };
}

// Fila de assinatura do contrato — combina sócios (estágio 0, implícito:
// não tem linha em SignatarioPadrao, são dinâmicos por cadastro) com os 4
// signatários fixos da Sakura (estágio 1 = aprovador, estágio 2 =
// testemunhas — ver seeds/signatarios-padrao.ts e
// processar-webhook-d4sign.use-case.ts). Status por linha:
// - `assinaturasPorEmail` (ContratoAssinatura, gravado pelo webhook
//   type_post=4) é o dado real — quem tem registro assinou naquela data.
// - Sem registro, cai no fallback inferido do status agregado do
//   Contrato (contratos anteriores ao log existir, ou fechados direto
//   pelo type_post=1, que não traz e-mail individual), seguindo a ordem
//   de fila do D4Sign documentada no use-case do webhook:
//   - aguardando_assinatura: ninguém assinou ainda.
//   - assinado_agencia: o aprovador só assina depois dos sócios (estágio
//     0 vem antes do 1 na fila do D4Sign), então os sócios já assinaram.
//   - assinado: documento fechado, todo mundo assinou.
export function montarFilaAssinatura(
  representantesLegais: RepresentanteLegalDetalhe[],
  signatariosPadraoAtivos: SignatarioPadrao[],
  statusContrato: string | null,
  emailsNaoEntregues: Set<string>,
  assinaturasPorEmail: Map<string, Date>,
): SignatarioFila[] {
  const socioAssinadoInferido =
    statusContrato === CONTRATO_STATUS_ASSINADO_AGENCIA ||
    statusContrato === CONTRATO_STATUS_ASSINADO;

  // `administrativo === false` é a única marca que exclui um sócio da
  // fila — mesma regra usada na geração real do contrato (ver
  // AnalisarCadastroUseCase/AprovarCadastroComplementarUseCase).
  const filaSocios: SignatarioFila[] = representantesLegais
    .filter((socio) => socio.administrativo !== false)
    .map((socio, index) => {
      const assinadoEm = assinaturasPorEmail.get(socio.email) ?? null;
      return {
        id: socio.id,
        nome: socio.nome,
        email: socio.email,
        grupo: "Agência",
        ordem: index + 1,
        assinado: assinadoEm !== null || socioAssinadoInferido,
        assinadoEm,
        emailNaoEntregue: emailsNaoEntregues.has(socio.email),
      };
    });

  const filaSakura: SignatarioFila[] = [...signatariosPadraoAtivos]
    .sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0))
    .map((signatario) => {
      const assinadoEm = signatario.email
        ? (assinaturasPorEmail.get(signatario.email) ?? null)
        : null;
      const assinadoInferido =
        statusContrato === CONTRATO_STATUS_ASSINADO ||
        (statusContrato === CONTRATO_STATUS_ASSINADO_AGENCIA && signatario.papel === "APROVAR");
      return {
        id: signatario.id,
        nome: signatario.nome ?? signatario.email ?? "—",
        email: signatario.email,
        grupo: "Sakura" as const,
        ordem: filaSocios.length + (signatario.ordem ?? 0),
        assinado: assinadoEm !== null || assinadoInferido,
        assinadoEm,
        emailNaoEntregue: signatario.email ? emailsNaoEntregues.has(signatario.email) : false,
      };
    });

  return [...filaSocios, ...filaSakura];
}

export function labelStatusContrato(status: string | null): string {
  if (status === CONTRATO_STATUS_ASSINADO) return "Assinado";
  if (status === CONTRATO_STATUS_ASSINADO_AGENCIA) return "Sócios assinaram — aguardando Sakura";
  if (status === CONTRATO_STATUS_AGUARDANDO_ASSINATURA) return "Aguardando assinaturas";
  return "—";
}

// Recorte plano da análise de IA — null se o documento ainda não foi
// analisado (não é erro, é o estado normal antes da IA rodar).
export function paraAnaliseIaResumo(analise: AnaliseIaDocumento | null): AnaliseIaResumo | null {
  if (!analise) return null;
  return {
    confiancaExtracao: analise.confiancaExtracao,
    alertas: analise.alertas,
    resumoAnalise: analise.resumoAnalise,
    camposExtraidos: analise.camposExtraidos,
    camposExtras: analise.camposExtras,
    textoBruto: analise.textoBruto,
    formatoValido: analise.formatoValido,
    camposObrigatoriosPresentes: analise.camposObrigatoriosPresentes,
    referenciaCruzadaOk: analise.referenciaCruzadaOk,
    detalhesChecagem: analise.detalhesChecagem,
    parecer: analise.parecer,
    comparacaoOficial: analise.comparacaoOficial,
  };
}

// Rótulo do tipo de documento como aparece pra IA no cruzamento
// documental (stage3) — nomenclatura própria da resposta do agente
// (snake_case), diferente do enum TipoDocumento do Prisma (RG_CNPJ etc);
// tipo desconhecido cai no próprio valor bruto, mesmo padrão de
// labelOrigemContrato/RESULTADO_ANALISE_LABELS acima.
const LABEL_TIPO_DOCUMENTO_IA: Record<string, string> = {
  contrato_social: "Contrato Social",
  doc_identificacao: "RG/CNH",
};

function labelTipoDocumentoIa(tipo: string): string {
  return LABEL_TIPO_DOCUMENTO_IA[tipo] ?? tipo;
}

// Extrai só os pontos que o analista precisa checar de um documento do
// stage3: campos onde o extraído/oficial diverge do que foi fornecido
// (confere: false) e alertas de extração — nunca os campos que
// conferem, isso é ruído pro analista, não uma pendência.
function mensagensDoDocumento(detalhe: AnaliseIaDocumentoDetalhe): string[] {
  const mensagens: string[] = [];

  for (const campo of detalhe.campos) {
    if (campo.confere) continue;
    mensagens.push(
      `${campo.campo}: informado "${campo.fornecido ?? "—"}", extraído "${campo.extraido ?? "—"}"${campo.oficial ? `, oficial "${campo.oficial}"` : ""}`,
    );
  }

  mensagens.push(...detalhe.alertasExtracao);

  if (!detalhe.valido && detalhe.campos.length === 0 && detalhe.alertasExtracao.length === 0) {
    mensagens.push("Documento não pôde ser validado.");
  }

  return mensagens;
}

// Um item por documento com pendência — documentos sem nenhuma mensagem
// (tudo conferiu) não entram, pra não poluir o grupo da entidade.
function documentosComPendencia(
  documentos: AnaliseIaDocumentoDetalhe[],
): ParecerIaChecklistDocumento[] {
  return documentos
    .map((documento) => ({
      tipoLabel: labelTipoDocumentoIa(documento.tipo),
      mensagens: mensagensDoDocumento(documento),
    }))
    .filter((documento) => documento.mensagens.length > 0);
}

// Consolida o parecer da IA (veredito, motivo, pontos de alerta e
// checklist) numa seção só — pedido explícito do usuário em vez de
// espalhar essa informação em blocos separados pela ficha. `resultado`
// classifica POR QUE chegou nesse status (REPROVADO real vs
// FALHA_ANALISE/FALHA_CONTRATO técnicas vs EM_ANALISE ainda pendente) —
// é o dado mais confiável pro badge, já que `parecer` (texto bruto do
// agente externo) fica null nas falhas técnicas. null só em cadastros
// anteriores a esta funcionalidade existir.
export function paraParecerView(analiseIa: AnaliseIaAgenciaDetalhe | null): ParecerIaView | null {
  if (!analiseIa) return null;

  const detalhamento = analiseIa.detalhamento;
  const documentosAgencia = detalhamento
    ? documentosComPendencia(detalhamento.documentosEmpresa)
    : [];
  const gruposParaChecar: ParecerIaChecklistGrupo[] = [
    ...(documentosAgencia.length > 0
      ? [{ entidadeLabel: "Agência", documentos: documentosAgencia }]
      : []),
    ...(detalhamento
      ? detalhamento.socios
          .map((socio, index) => ({
            entidadeLabel: `Sócio ${index + 1} — ${socio.nome}`,
            documentos: documentosComPendencia(socio.documentos),
          }))
          .filter((grupo) => grupo.documentos.length > 0)
      : []),
  ];

  return {
    resultado: analiseIa.resultado,
    parecer: analiseIa.parecer,
    motivo: analiseIa.motivo,
    pontosDeAlerta: analiseIa.flagsRisco,
    gruposParaChecar,
    avaliadoEm: analiseIa.avaliadoEm,
  };
}

// Verificação cadastral (stage1) pro dossiê (ver VerificacaoCadastral) —
// comparação fornecido x oficial que o agente já calcula (razão social,
// nome fantasia, e-mail, sócios) mais CNAE principal/secundários com
// compatibilidade de turismo. null tanto em cadastros anteriores a essa
// funcionalidade quanto quando o agente não trouxe stage1 (ex.: mock local
// sem AGENCY_ANALYSIS_API_KEY). Reaproveita o tipo de domínio diretamente
// em vez de duplicar em dossie.types.ts — mesma decisão já tomada pra
// AnaliseCreditoView.amat.
export function paraVerificacaoCadastralView(
  analiseIa: AnaliseIaAgenciaDetalhe | null,
): AnaliseIaStage1 | null {
  return analiseIa?.stage1 ?? null;
}

// AMAT/SOFIA reais pro dossiê (ver ConsultaAmatCard/ConsultaSofiaCard) —
// null/vazio tanto em cadastros anteriores a esta funcionalidade quanto
// em cadastros que já passaram pela IA mas cujo agente não populou
// stage2/raw_data (ex.: gate de CNAE interrompeu a análise antes do
// stage2 rodar, ver docs/agency-analysis-params-tracking.md).
function paraHistoricoConsultaCreditoView(
  item: HistoricoConsultaCreditoItem,
): HistoricoConsultaCreditoView {
  return {
    id: item.id,
    sucesso: item.sucesso,
    erro: item.erro,
    consultadoPor: item.consultadoPor,
    consultadoEm: item.createdAt,
  };
}

export function paraAnaliseCreditoView(
  analiseIa: AnaliseIaAgenciaDetalhe | null,
  historicoConsultaCredito: HistoricoConsultaCreditoItem[],
): AnaliseCreditoView {
  return {
    amat: analiseIa?.stage2?.amat ?? null,
    sofia: analiseIa?.stage2?.sofia ?? null,
    rawAmat: analiseIa?.rawData?.amat ?? [],
    rawSofia: analiseIa?.rawData?.sofia ?? [],
    historicoAmat: historicoConsultaCredito
      .filter((item) => item.fonte === "AMAT")
      .map(paraHistoricoConsultaCreditoView),
    historicoSofia: historicoConsultaCredito
      .filter((item) => item.fonte === "SOFIA")
      .map(paraHistoricoConsultaCreditoView),
  };
}

// Recorte plano do Usuário Master — a entidade de domínio (classe com
// getters) não pode atravessar a fronteira Server → Client Component
// (UsuarioMaster, em usuario-master.tsx, é "use client"); esse objeto
// plano é o que de fato vira prop.
export interface UsuarioMasterView {
  nome: string;
  email: string;
  cpf: string;
  telefone: string;
  rg: string;
  rgOrgaoEmissor: string;
  rgUf: string;
  dataNascimento: Date | null;
  origemRepresentanteLegalId: string | null;
  salvoPor: string | null;
  salvoEm: Date | null;
}

export function paraUsuarioMasterView(
  usuarioMaster: UsuarioMaster | null,
): UsuarioMasterView | null {
  if (!usuarioMaster) return null;
  return {
    nome: usuarioMaster.nome ?? "",
    email: usuarioMaster.email ?? "",
    cpf: usuarioMaster.cpf ?? "",
    telefone: usuarioMaster.telefone ?? "",
    rg: usuarioMaster.rg ?? "",
    rgOrgaoEmissor: usuarioMaster.rgOrgaoEmissor ?? "",
    rgUf: usuarioMaster.rgUf ?? "",
    dataNascimento: usuarioMaster.dataNascimento,
    origemRepresentanteLegalId: usuarioMaster.origemRepresentanteLegalId,
    salvoPor: usuarioMaster.salvoPor,
    salvoEm: usuarioMaster.salvoEm,
  };
}

// "Completo" trava o botão "Ativar cliente" — mesmo critério que a
// própria tela de Usuário Master já usa pro selo "Completo"/"Pendente".
export function usuarioMasterEstaCompleto(usuarioMaster: UsuarioMasterView | null): boolean {
  if (!usuarioMaster) return false;
  return (
    usuarioMaster.dataNascimento !== null &&
    [
      usuarioMaster.nome,
      usuarioMaster.email,
      usuarioMaster.cpf,
      usuarioMaster.telefone,
      usuarioMaster.rg,
      usuarioMaster.rgOrgaoEmissor,
      usuarioMaster.rgUf,
    ].every((campo) => campo.trim() !== "")
  );
}

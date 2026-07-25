import type { Documento } from "@/modules/cadastro/domain/entities/documento.entity";
import type { TipoDocumento } from "@/modules/cadastro/domain/enums";
import type { AnaliseIaDocumento } from "@/modules/cadastro/domain/entities/analise-ia-documento.entity";
import type { SignatarioPadrao } from "@/modules/cadastro/domain/entities/signatario-padrao.entity";
import type { UsuarioMaster } from "@/modules/cadastro/domain/entities/usuario-master.entity";
import type { AnaliseIaDocumentoDetalhe } from "@/modules/cadastro/domain/services/analise-ia-service";
import { ESTADO_CIVIL_OPCOES } from "@/modules/cadastro/types/socio-wizard.types";
import {
  TIPO_CONTA_OPCOES,
  BANCO_PAIS_OPCOES,
} from "@/modules/cadastro/types/endereco-banco.types";
import {
  STATUS_ATIVO,
  STATUS_AGUARDANDO_ASSINATURA,
  STATUS_AGUARDANDO_ATIVACAO,
  STATUS_AGUARDANDO_VALIDACAO,
  STATUS_EM_COMPLEMENTAR,
  STATUS_RECUSADO,
  CONTRATO_STATUS_AGUARDANDO_ASSINATURA,
  CONTRATO_STATUS_ASSINADO_AGENCIA,
  CONTRATO_STATUS_ASSINADO,
  type RepresentanteLegalDetalhe,
  type AnaliseIaAgenciaDetalhe,
} from "@/modules/cadastro/domain/repositories/agencia-repository";
import type {
  DocumentoRevisao,
  DocumentoHistoricoItem,
  SignatarioFila,
  AnaliseIaResumo,
  ParecerIaView,
  ParecerIaItemChecklist,
} from "@/modules/admin/types/dossie.types";

// Traduz dado bruto do domínio (Agencia/Documento/enums) pra formato que
// a View do dossiê consome — nenhum desses cálculos deve viver dentro do
// componente de página ou dos componentes de apresentação.

export function labelOrigemContrato(origem: "ia" | "humano" | null): string {
  if (origem === "ia") return "gerado pela IA";
  if (origem === "humano") return "gerado pelo analista";
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
  logradouro: string;
  numero: string;
  bairro: string;
  cidade: string;
  uf: string;
}): string {
  if (!endereco.logradouro) return "—";
  return `${endereco.logradouro}, ${endereco.numero || "s/n"} — ${endereco.bairro}, ${endereco.cidade}/${endereco.uf}`;
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
// processar-webhook-d4sign.use-case.ts). `assinado` por linha é
// derivado do status agregado do Contrato (único dado real que temos),
// seguindo a ordem de fila do D4Sign documentada no use-case do webhook:
// - aguardando_assinatura: ninguém assinou ainda.
// - assinado_agencia: o aprovador só assina depois dos sócios (estágio 0
//   vem antes do 1 na fila do D4Sign), então os sócios já assinaram.
// - assinado: documento fechado, todo mundo (incluindo testemunhas)
//   assinou.
// Não existe timestamp nem status individual por pessoa no schema hoje —
// isso é uma inferência sobre o status agregado, não um dado inventado.
export function montarFilaAssinatura(
  representantesLegais: RepresentanteLegalDetalhe[],
  signatariosPadraoAtivos: SignatarioPadrao[],
  statusContrato: string | null,
  emailsNaoEntregues: Set<string>,
): SignatarioFila[] {
  const socioAssinado =
    statusContrato === CONTRATO_STATUS_ASSINADO_AGENCIA ||
    statusContrato === CONTRATO_STATUS_ASSINADO;

  const filaSocios: SignatarioFila[] = representantesLegais.map((socio, index) => ({
    id: socio.id,
    nome: socio.nome,
    email: socio.email,
    grupo: "Agência",
    ordem: index + 1,
    assinado: socioAssinado,
    emailNaoEntregue: emailsNaoEntregues.has(socio.email),
  }));

  const filaSakura: SignatarioFila[] = [...signatariosPadraoAtivos]
    .sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0))
    .map((signatario) => {
      const assinado =
        statusContrato === CONTRATO_STATUS_ASSINADO ||
        (statusContrato === CONTRATO_STATUS_ASSINADO_AGENCIA && signatario.papel === "APROVAR");
      return {
        id: signatario.id,
        nome: signatario.nome ?? signatario.email ?? "—",
        email: signatario.email,
        grupo: "Sakura" as const,
        ordem: filaSocios.length + (signatario.ordem ?? 0),
        assinado,
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
  };
}

// Extrai só os pontos que o analista precisa checar de um documento do
// stage3: campos onde o extraído/oficial diverge do que foi fornecido
// (confere: false) e alertas de extração — nunca os campos que
// conferem, isso é ruído pro analista, não uma pendência.
function itensDoDocumento(
  detalhe: AnaliseIaDocumentoDetalhe,
  origem: string,
): ParecerIaItemChecklist[] {
  const itens: ParecerIaItemChecklist[] = [];

  for (const campo of detalhe.campos) {
    if (campo.confere) continue;
    itens.push({
      origem,
      mensagem: `${campo.campo}: informado "${campo.fornecido ?? "—"}", extraído "${campo.extraido ?? "—"}"${campo.oficial ? `, oficial "${campo.oficial}"` : ""}`,
    });
  }

  for (const alerta of detalhe.alertasExtracao) {
    itens.push({ origem, mensagem: alerta });
  }

  if (!detalhe.valido && detalhe.campos.length === 0 && detalhe.alertasExtracao.length === 0) {
    itens.push({ origem, mensagem: "Documento não pôde ser validado." });
  }

  return itens;
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
  const itensParaChecar: ParecerIaItemChecklist[] = detalhamento
    ? [
        ...detalhamento.documentosEmpresa.flatMap((documento) =>
          itensDoDocumento(documento, documento.tipo),
        ),
        ...detalhamento.socios.flatMap((socio) =>
          socio.documentos.flatMap((documento) => itensDoDocumento(documento, socio.nome)),
        ),
      ]
    : [];

  return {
    resultado: analiseIa.resultado,
    parecer: analiseIa.parecer,
    motivo: analiseIa.motivo,
    pontosDeAlerta: analiseIa.flagsRisco,
    itensParaChecar,
    avaliadoEm: analiseIa.avaliadoEm,
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

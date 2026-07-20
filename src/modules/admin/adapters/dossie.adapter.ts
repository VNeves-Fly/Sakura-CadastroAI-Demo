import type { Documento } from "@/modules/cadastro/domain/entities/documento.entity";
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
} from "@/modules/cadastro/domain/repositories/agencia-repository";
import type { DocumentoRevisao } from "@/modules/admin/types/dossie.types";

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
// tabela existir) -> item pronto pra tela de revisão.
export function paraDocumentoRevisao(
  documento: Documento | null,
  label: string,
): DocumentoRevisao[] {
  if (!documento) return [];
  return [
    {
      id: documento.id,
      label,
      gcsPath: documento.gcsPath,
      status: documento.status,
      motivoReprovacao: documento.motivoReprovacao,
    },
  ];
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

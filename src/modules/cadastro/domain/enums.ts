// Espelham os enums de prisma/schema.prisma como union types puros, sem
// depender do @prisma/client — mantém o domínio livre de framework (ver
// README.md, seção de arquitetura hexagonal).

export type StatusAgencia =
  | "em_analise"
  | "em_complementar"
  | "aguardando_assinatura"
  | "aguardando_validacao"
  | "aguardando_ativacao"
  | "ativo"
  | "recusado";

export type StatusContrato = "aguardando_assinatura" | "assinado_agencia" | "assinado";

export type OrigemGeracaoContrato = "ia" | "humano";

export type TipoDocumento =
  | "CONTRATO_SOCIAL"
  | "CADASTUR"
  | "RG_CNPJ"
  | "COMPROVANTE_ENDERECO"
  | "COMPROVANTE_ENDERECO_AGENCIA"
  | "CERTIDAO_CASAMENTO"
  | "PROCURACAO";

export type StatusDocumento = "PENDENTE" | "APROVADO" | "REPROVADO";

export type PapelRepresentante = "SOCIO" | "PROCURADOR";

// Espelha o enum PapelSignatarioPadrao do schema — catálogo completo do
// campo `act` da API do D4Sign (docs/d4sign.md).
export type PapelSignatarioPadrao =
  | "ASSINAR"
  | "APROVAR"
  | "RECONHECER"
  | "ASSINAR_COMO_PARTE"
  | "ASSINAR_COMO_TESTEMUNHA"
  | "ASSINAR_COMO_INTERVENIENTE"
  | "ACUSAR_RECEBIMENTO"
  | "ASSINAR_COMO_EMISSOR_ENDOSSANTE_AVALISTA"
  | "ASSINAR_COMO_EMISSOR_ENDOSSANTE_AVALISTA_FIADOR"
  | "ASSINAR_COMO_FIADOR"
  | "ASSINAR_COMO_PARTE_E_FIADOR"
  | "ASSINAR_COMO_RESPONSAVEL_SOLIDARIO"
  | "ASSINAR_COMO_PARTE_E_RESPONSAVEL_SOLIDARIO";

export type TipoVenda = "NACIONAL" | "INTERNACIONAL" | "TERRESTRE";

export type EtapaDecisao = "ANALISE" | "COMPLEMENTAR";

export type ResultadoDecisao = "APROVADO" | "REPROVADO";

// Classificação de por que a agência chegou no status atual, gravada em
// AnaliseIaAgencia.resultado (ver AnalisarCadastroUseCase): REPROVADO é
// um parecer real da IA; FALHA_ANALISE é quando a chamada de avaliação
// falhou tecnicamente (nunca chegou a produzir parecer); FALHA_CONTRATO
// é quando a IA aprovou mas a geração/envio do contrato falhou.
export type ResultadoAnaliseIa = "APROVADO" | "REPROVADO" | "FALHA_ANALISE" | "FALHA_CONTRATO";

// Espelha o enum MaritalStatus do agente de análise de documentos
// (domain/entities/marital_status.py) — não é um enum do Prisma
// (estadoCivil é String no schema), mas o valor só pode vir de um destes
// 7 valores depois de normalizado (ver estado-civil.util.ts).
export type EstadoCivil =
  "solteiro" | "casado" | "separado" | "divorciado" | "viuvo" | "uniao_estavel" | "desquitado";

export const ESTADO_CIVIL_VALORES: readonly [EstadoCivil, ...EstadoCivil[]] = [
  "solteiro",
  "casado",
  "separado",
  "divorciado",
  "viuvo",
  "uniao_estavel",
  "desquitado",
];

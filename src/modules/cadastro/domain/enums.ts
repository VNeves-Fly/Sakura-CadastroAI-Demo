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

export type StatusContrato = "aguardando_assinatura" | "assinado";

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

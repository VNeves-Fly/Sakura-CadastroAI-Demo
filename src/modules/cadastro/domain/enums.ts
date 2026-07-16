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

export type TipoVenda = "NACIONAL" | "INTERNACIONAL" | "TERRESTRE";

export type EtapaDecisao = "ANALISE" | "COMPLEMENTAR";

export type ResultadoDecisao = "APROVADO" | "REPROVADO";

import { ESTADO_CIVIL_OPCOES } from "@/modules/cadastro/types/socio-wizard.types";
import type { ContratoSignatario } from "@/modules/cadastro/domain/services/contrato-assinatura-service";

function labelEstadoCivil(valor: string | null): string {
  if (!valor) return "";
  return ESTADO_CIVIL_OPCOES.find((opcao) => opcao.valor === valor)?.label ?? valor;
}

// Junta segmentos não vazios com ", " — usado pra nunca deixar vírgula
// sobrando quando um dado (nacionalidade, complemento, etc.) está ausente.
function juntarNaoVazios(segmentos: Array<string | null | undefined>, separador = ", "): string {
  return segmentos
    .map((segmento) => segmento?.trim())
    .filter((segmento): segmento is string => Boolean(segmento))
    .join(separador);
}

// Monta a cláusula jurídica de um signatário pro template do D4Sign —
// sempre "REPRESENTANTE LEGAL" (constante, nunca o cargo societário real
// de RepresentanteLegal.cargo) e dados pessoais em CAIXA ALTA. Segmentos
// sem dado (RG, endereço) são omitidos inteiros em vez de aparecer em
// branco.
export function formatarClausulaSocio(signatario: ContratoSignatario): string {
  const identificacao = juntarNaoVazios([
    signatario.nome,
    signatario.nacionalidade,
    labelEstadoCivil(signatario.estadoCivil),
    "REPRESENTANTE LEGAL",
  ]).toUpperCase();

  // Cada trecho carrega sua própria vírgula/conector de abertura (em vez
  // de fixo no template) — assim, se um trecho inteiro faltar (ex: sem
  // cidade/UF), some junto com a vírgula, sem deixar ", ," sobrando.
  const rgTrecho = signatario.rgNumero
    ? `, portador da Cédula de Identidade RG ${juntarNaoVazios([signatario.rgNumero, signatario.rgOrgaoEmissor], "/")} inscrito no CPF/ME sob o n° ${signatario.cpf}`
    : `, inscrito no CPF/ME sob o n° ${signatario.cpf}`;

  const { cidade, uf, logradouro, numero, complemento, bairro, cep } = signatario.endereco;
  const domicilioTrecho =
    cidade || uf
      ? `, residente e domiciliado ${juntarNaoVazios([cidade ? `na Cidade de ${cidade}` : null, uf ? `Estado de ${uf}` : null])}, Brasil`
      : "";

  const enderecoResidencial = juntarNaoVazios([
    logradouro,
    numero ? `N ${numero}` : null,
    complemento,
    bairro,
    cep ? `CEP ${cep}` : null,
  ]);
  const residenciaTrecho = enderecoResidencial
    ? `, com residência na(o) ${enderecoResidencial}`
    : "";

  return `${identificacao}${rgTrecho}${domicilioTrecho}${residenciaTrecho}`;
}

// "indicacao" do template — frase fixa que só varia no singular/plural
// conforme a quantidade de signatarios (regra de negócio pura, não
// derivada de nenhum dado).
export function formatarIndicacaoRepresentantes(quantidadeSignatarios: number): string {
  return quantidadeSignatarios > 1
    ? "indicados os representantes legais da empresa"
    : "indicado o representante legal da empresa";
}

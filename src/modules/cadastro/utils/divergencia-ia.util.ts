// Compara o que o usuário digitou com o valor bruto que a IA extraiu do
// documento (RG/CNH ou contrato social) — nunca bloqueia o preenchimento,
// só sinaliza pro humano revisar. `normalizar` deixa comparar formatos
// diferentes (ex: CPF mascarado vs. só dígitos) sem falso-positivo.
export function verificarDivergenciaCampo(
  rotulo: string,
  valorAtual: string,
  valorExtraidoIa: string | null,
  normalizar: (valor: string) => string = (valor) => valor.trim().toLowerCase(),
): { divergente: boolean; mensagem: string | null } {
  if (!valorExtraidoIa || valorAtual.length === 0) {
    return { divergente: false, mensagem: null };
  }

  const divergente = normalizar(valorAtual) !== normalizar(valorExtraidoIa);

  return {
    divergente,
    mensagem: divergente
      ? `${rotulo} digitado diverge do que a IA leu no documento ("${valorExtraidoIa}").`
      : null,
  };
}

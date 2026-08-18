// Máscara de data digitada à mão (dd/mm/aaaa) — usada no filtro
// "Personalizado" do Resumo do dia (4.1). Sem calendário: o analista
// digita só números e a barra "/" entra sozinha, mesmo padrão de
// mask/unmask do resto do projeto (ver cpf.util.ts).
export function unmaskData(valorMascarado: string): string {
  return valorMascarado.replace(/\D/g, "").slice(0, 8);
}

export function mascararData(valorDigitado: string): string {
  const limpo = unmaskData(valorDigitado);
  const partes = [limpo.slice(0, 2), limpo.slice(2, 4), limpo.slice(4, 8)];

  let resultado = partes[0] ?? "";
  if (partes[1]) resultado += `/${partes[1]}`;
  if (partes[2]) resultado += `/${partes[2]}`;

  return resultado;
}

// Checagem só de formato/faixa (dd 01-31, mm 01-12, aaaa com 4 dígitos) —
// não valida se o dia existe de fato no mês (ex.: 31/02), suficiente pra
// habilitar o botão de aplicar sem exigir uma lib de datas pra isto.
export function dataDigitadaCompleta(valorMascarado: string): boolean {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(valorMascarado);
  if (!match) return false;

  const dia = Number(match[1]);
  const mes = Number(match[2]);
  return dia >= 1 && dia <= 31 && mes >= 1 && mes <= 12;
}

// Ano exibido nos títulos/labels ("Compraram em {ano}", "Total {ano}"...)
// — calculado a partir do relógio real, não da fixture (que continua
// fixa em 13/08/2026): em 2027 os RÓTULOS viram "2027" sozinhos, sem
// precisar editar nada aqui. Só o texto muda; os números mock (fixos)
// não representam o ano corrente de verdade, ver dashboard-vendas.mock-service.ts.
export function anoAtual(): number {
  return new Date().getFullYear();
}

export function anoAnterior(): number {
  return anoAtual() - 1;
}

// "Atualizado em DD/MM às HH:mm" — usado nos subtítulos de Resumo do dia,
// Vendas Intraday e Projeção do dia (4.1/4.3/4.4).
export function formatarAtualizadoEm(data: Date): string {
  const dia = data.getDate().toString().padStart(2, "0");
  const mes = (data.getMonth() + 1).toString().padStart(2, "0");
  const hora = data.getHours().toString().padStart(2, "0");
  const minuto = data.getMinutes().toString().padStart(2, "0");
  return `${dia}/${mes} às ${hora}:${minuto}`;
}

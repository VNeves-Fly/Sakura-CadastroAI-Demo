// "Atualizado em DD/MM às HH:mm" — usado nos subtítulos de Resumo do dia,
// Vendas Intraday e Projeção do dia (4.1/4.3/4.4).
export function formatarAtualizadoEm(data: Date): string {
  const dia = data.getDate().toString().padStart(2, "0");
  const mes = (data.getMonth() + 1).toString().padStart(2, "0");
  const hora = data.getHours().toString().padStart(2, "0");
  const minuto = data.getMinutes().toString().padStart(2, "0");
  return `${dia}/${mes} às ${hora}:${minuto}`;
}

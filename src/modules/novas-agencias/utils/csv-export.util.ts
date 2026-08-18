// Export CSV 100% client-side (Blob + <a download>) — sem backend
// envolvido, só serve os dados que já estão na tela (mesmo padrão do
// resto do projeto, ver dashboard-vendas/utils/csv-export.util.ts).
function escaparCampoCsv(valor: string | number): string {
  const texto = String(valor);
  return /[",;\n]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
}

export function exportarCsv(
  nomeArquivo: string,
  colunas: string[],
  linhas: Array<Array<string | number>>,
): void {
  const conteudo = [colunas, ...linhas]
    .map((linha) => linha.map(escaparCampoCsv).join(";"))
    .join("\n");
  // BOM (﻿) — sem isso o Excel abre acentuação pt-BR corrompida.
  const blob = new Blob([`﻿${conteudo}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = nomeArquivo;
  link.click();
  URL.revokeObjectURL(url);
}

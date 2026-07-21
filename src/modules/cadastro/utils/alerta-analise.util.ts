// O agents-service devolve os alertas já com um prefixo textual embutido
// ("Info 1: ...", "Warning 1: ...") e o adapter local acrescenta "Erro: "
// pros itens de `errors` — aqui a gente separa esse prefixo do tipo real,
// pra decidir o que exibir (Info é ruído, não mostramos) e a cor certa.
export type TipoAlerta = "info" | "warning" | "erro";

export interface AlertaAnaliseParsed {
  tipo: TipoAlerta;
  mensagem: string;
}

const TIPOS_POR_PREFIXO: Record<string, TipoAlerta> = {
  info: "info",
  warning: "warning",
  erro: "erro",
};

export function parseAlertaAnalise(alerta: string): AlertaAnaliseParsed {
  const match = /^(info|warning|erro)\s*\d*\s*:\s*/i.exec(alerta);

  if (!match) {
    return { tipo: "warning", mensagem: alerta };
  }

  const tipo = TIPOS_POR_PREFIXO[(match[1] ?? "").toLowerCase()] ?? "warning";
  return { tipo, mensagem: alerta.slice(match[0].length) };
}

// Descarta os alertas do tipo "info" (não relevantes pro usuário) e devolve
// só o que deve aparecer na tela, já classificado por tipo.
export function alertasVisiveis(alertas: string[]): AlertaAnaliseParsed[] {
  return alertas.map(parseAlertaAnalise).filter((alerta) => alerta.tipo !== "info");
}

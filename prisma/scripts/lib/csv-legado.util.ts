import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const PASTA_BKP = join(process.cwd(), "docs/db/bkp");

// Parser mínimo pro formato dos exports do banco antigo (`;`-separado, sem
// aspas/escaping nos dados — confirmado manualmente nos 6 arquivos antes de
// escrever isso). Não é um parser de CSV genérico de propósito.
export function lerCsvLegado(prefixoArquivo: string): Record<string, string>[] {
  const arquivo = readdirSync(PASTA_BKP).find(
    (nome) => nome.startsWith(prefixoArquivo) && nome.endsWith(".csv"),
  );
  if (!arquivo) {
    throw new Error(`Nenhum arquivo "${prefixoArquivo}*.csv" encontrado em ${PASTA_BKP}`);
  }

  const conteudo = readFileSync(join(PASTA_BKP, arquivo), "utf-8");
  const linhas = conteudo.split("\n").filter((linha) => linha.trim().length > 0);
  const cabecalho = linhas[0]!.split(";");

  return linhas.slice(1).map((linha) => {
    const valores = linha.split(";");
    const registro: Record<string, string> = {};
    cabecalho.forEach((coluna, index) => {
      registro[coluna] = (valores[index] ?? "").trim();
    });
    return registro;
  });
}

import Link from "next/link";
import type { Cidade } from "@/modules/atribuicoes/types/atribuicao.types";

interface CidadesTabProps {
  cidades: Cidade[];
  totalFiltrado: number;
  paginaAtual: number;
  totalPaginas: number;
  busca: string;
  executivo: string;
  gestor: string;
}

export function CidadesTab({
  cidades,
  totalFiltrado,
  paginaAtual,
  totalPaginas,
  busca,
  executivo,
  gestor,
}: CidadesTabProps) {
  function hrefPagina(pagina: number): string {
    const params = new URLSearchParams();
    params.set("aba", "cidades");
    if (busca) params.set("busca", busca);
    if (executivo) params.set("executivo", executivo);
    if (gestor) params.set("gestor", gestor);
    params.set("pagina", String(pagina));
    return `/atribuicoes?${params.toString()}`;
  }

  if (cidades.length === 0) {
    return (
      <p className="text-muted-foreground p-6 text-center text-sm">Nenhuma cidade encontrada.</p>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-border bg-muted/40 border-b">
            <tr>
              <th className="text-muted-foreground px-4 py-2.5 font-medium">Cidade</th>
              <th className="text-muted-foreground px-4 py-2.5 font-medium">Estado</th>
              <th className="text-muted-foreground px-4 py-2.5 font-medium">DDD</th>
              <th className="text-muted-foreground px-4 py-2.5 font-medium">Região</th>
              <th className="text-muted-foreground px-4 py-2.5 font-medium">Base</th>
              <th className="text-muted-foreground px-4 py-2.5 font-medium">Executivo</th>
              <th className="text-muted-foreground px-4 py-2.5 font-medium">Gestor</th>
            </tr>
          </thead>
          <tbody>
            {cidades.map((cidade, index) => (
              <tr
                key={`${cidade.cidade}-${index}`}
                className="border-border border-b last:border-0"
              >
                <td className="text-foreground px-4 py-2.5">{cidade.cidade}</td>
                <td className="text-muted-foreground px-4 py-2.5">{cidade.estado ?? "—"}</td>
                <td className="text-muted-foreground px-4 py-2.5">{cidade.ddd ?? "—"}</td>
                <td className="text-muted-foreground px-4 py-2.5">{cidade.regiao ?? "—"}</td>
                <td className="text-foreground px-4 py-2.5">{cidade.base ?? "—"}</td>
                <td className="text-foreground px-4 py-2.5">{cidade.executivo ?? "—"}</td>
                <td className="text-foreground px-4 py-2.5">{cidade.gestor ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between gap-3 p-4">
        <p className="text-muted-foreground text-xs">
          {totalFiltrado} cidade(s) encontrada(s) — página {paginaAtual} de {totalPaginas}
        </p>
        <div className="flex gap-2">
          {paginaAtual > 1 ? (
            <Link
              href={hrefPagina(paginaAtual - 1)}
              className="border-input hover:bg-accent rounded-full border px-3 py-1.5 text-xs font-medium transition"
            >
              Anterior
            </Link>
          ) : null}
          {paginaAtual < totalPaginas ? (
            <Link
              href={hrefPagina(paginaAtual + 1)}
              className="border-input hover:bg-accent rounded-full border px-3 py-1.5 text-xs font-medium transition"
            >
              Próxima
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}

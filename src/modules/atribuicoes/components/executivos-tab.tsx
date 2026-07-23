import Link from "next/link";
import type { ResumoExecutivo } from "@/modules/atribuicoes/types/atribuicao.types";

interface ExecutivosTabProps {
  executivos: ResumoExecutivo[];
}

export function ExecutivosTab({ executivos }: ExecutivosTabProps) {
  if (executivos.length === 0) {
    return (
      <p className="text-muted-foreground p-6 text-center text-sm">Nenhum executivo encontrado.</p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="border-border bg-muted/40 border-b">
          <tr>
            <th className="text-muted-foreground px-4 py-2.5 font-medium">Executivo</th>
            <th className="text-muted-foreground px-4 py-2.5 font-medium">Base(s)</th>
            <th className="text-muted-foreground px-4 py-2.5 font-medium">Qtd. bases</th>
            <th className="text-muted-foreground px-4 py-2.5 font-medium">Gestor</th>
            <th className="text-muted-foreground px-4 py-2.5 font-medium">Cidades</th>
            <th className="text-muted-foreground px-4 py-2.5 font-medium">
              Agências
              <span className="text-muted-foreground/70 ml-1 font-normal italic">(exemplo)</span>
            </th>
            <th className="text-muted-foreground px-4 py-2.5 font-medium"></th>
          </tr>
        </thead>
        <tbody>
          {executivos.map((executivo) => (
            <tr key={executivo.executivo} className="border-border border-b last:border-0">
              <td className="text-foreground px-4 py-3 font-medium">{executivo.executivo}</td>
              <td className="text-foreground px-4 py-3">{executivo.base ?? "—"}</td>
              <td className="text-foreground px-4 py-3">{executivo.totalBases}</td>
              <td className="text-foreground px-4 py-3">{executivo.gestor ?? "—"}</td>
              <td className="text-foreground px-4 py-3">{executivo.totalCidades}</td>
              <td className="px-4 py-3">
                <span className="bg-primary/10 text-primary rounded-full px-2.5 py-0.5 text-xs font-semibold">
                  {executivo.totalAgenciasMock}
                </span>
              </td>
              <td className="px-4 py-3 text-right">
                <Link
                  href={`/atribuicoes/substituir?tipo=executivo&nome=${encodeURIComponent(executivo.executivo)}`}
                  className="text-primary text-xs font-semibold whitespace-nowrap hover:underline"
                >
                  Substituir
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

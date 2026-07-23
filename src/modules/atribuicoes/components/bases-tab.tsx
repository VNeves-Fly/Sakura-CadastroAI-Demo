import type { ResumoBase } from "@/modules/atribuicoes/types/atribuicao.types";

interface BasesTabProps {
  bases: ResumoBase[];
}

export function BasesTab({ bases }: BasesTabProps) {
  if (bases.length === 0) {
    return (
      <p className="text-muted-foreground p-6 text-center text-sm">Nenhuma base encontrada.</p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="border-border bg-muted/40 border-b">
          <tr>
            <th className="text-muted-foreground px-4 py-2.5 font-medium">Base</th>
            <th className="text-muted-foreground px-4 py-2.5 font-medium">Gestor</th>
            <th className="text-muted-foreground px-4 py-2.5 font-medium">Região(ões)</th>
            <th className="text-muted-foreground px-4 py-2.5 font-medium">Executivos</th>
            <th className="text-muted-foreground px-4 py-2.5 font-medium">Cidades</th>
          </tr>
        </thead>
        <tbody>
          {bases.map((base) => (
            <tr key={base.base} className="border-border border-b last:border-0">
              <td className="text-foreground px-4 py-3 font-medium">{base.base}</td>
              <td className="text-foreground px-4 py-3">{base.gestor ?? "—"}</td>
              <td className="text-muted-foreground px-4 py-3 text-xs">
                {base.regioes.join(", ") || "—"}
              </td>
              <td className="text-foreground px-4 py-3">{base.totalExecutivos}</td>
              <td className="text-foreground px-4 py-3">{base.totalCidades}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

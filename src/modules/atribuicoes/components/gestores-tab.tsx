import type { ResumoGestor } from "@/modules/atribuicoes/types/atribuicao.types";

interface GestoresTabProps {
  gestores: ResumoGestor[];
}

export function GestoresTab({ gestores }: GestoresTabProps) {
  if (gestores.length === 0) {
    return (
      <p className="text-muted-foreground p-6 text-center text-sm">Nenhum gestor encontrado.</p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="border-border bg-muted/40 border-b">
          <tr>
            <th className="text-muted-foreground px-4 py-2.5 font-medium">Gestor</th>
            <th className="text-muted-foreground px-4 py-2.5 font-medium">Bases</th>
            <th className="text-muted-foreground px-4 py-2.5 font-medium">Executivos</th>
            <th className="text-muted-foreground px-4 py-2.5 font-medium">Cidades</th>
          </tr>
        </thead>
        <tbody>
          {gestores.map((gestor) => (
            <tr key={gestor.gestor} className="border-border border-b last:border-0">
              <td className="text-foreground px-4 py-3 font-medium">{gestor.gestor}</td>
              <td className="text-foreground px-4 py-3">{gestor.totalBases}</td>
              <td className="text-foreground px-4 py-3">{gestor.totalExecutivos}</td>
              <td className="text-foreground px-4 py-3">{gestor.totalCidades}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

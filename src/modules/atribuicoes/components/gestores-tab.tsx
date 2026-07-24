import Link from "next/link";
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
          <tr className="divide-border divide-x">
            <th className="text-muted-foreground px-4 py-2.5 font-medium">Gestor</th>
            <th className="text-muted-foreground px-4 py-2.5 font-medium">ID SICA</th>
            <th className="text-muted-foreground px-4 py-2.5 font-medium">E-mail</th>
            <th className="text-muted-foreground px-4 py-2.5 font-medium">Telefone</th>
            <th className="text-muted-foreground px-4 py-2.5 font-medium">Bases</th>
            <th className="text-muted-foreground px-4 py-2.5 font-medium">Executivos</th>
            <th className="text-muted-foreground px-4 py-2.5 font-medium">Cidades</th>
            <th className="text-muted-foreground px-4 py-2.5 font-medium">
              Agências
              <span className="text-muted-foreground/70 ml-1 font-normal italic">(exemplo)</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-border divide-y">
          {gestores.map((gestor) => (
            <tr key={gestor.gestor} className="divide-border divide-x">
              <td className="px-4 py-3 font-medium">
                <Link
                  href={`/atribuicoes/colaborador?tipo=gestor&nome=${encodeURIComponent(gestor.gestor)}`}
                  className="text-primary hover:underline"
                >
                  {gestor.gestor}
                </Link>
              </td>
              <td className="text-foreground px-4 py-3">{gestor.idSica ?? "—"}</td>
              <td className="text-foreground px-4 py-3">{gestor.email ?? "—"}</td>
              <td className="text-foreground px-4 py-3">{gestor.telefone ?? "—"}</td>
              <td className="text-foreground px-4 py-3">{gestor.totalBases}</td>
              <td className="text-foreground px-4 py-3">{gestor.totalExecutivos}</td>
              <td className="text-foreground px-4 py-3">{gestor.totalCidades}</td>
              <td className="px-4 py-3">
                <span className="bg-primary/10 text-primary rounded-full px-2.5 py-0.5 text-xs font-semibold">
                  {gestor.totalAgenciasMock}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

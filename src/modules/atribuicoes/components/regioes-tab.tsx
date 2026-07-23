import type { ResumoRegiao } from "@/modules/atribuicoes/types/atribuicao.types";

interface RegioesTabProps {
  regioes: ResumoRegiao[];
}

export function RegioesTab({ regioes }: RegioesTabProps) {
  if (regioes.length === 0) {
    return (
      <p className="text-muted-foreground p-6 text-center text-sm">Nenhuma região encontrada.</p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
      {regioes.map((regiao) => (
        <div
          key={regiao.regiao}
          className="border-border bg-card flex flex-col gap-2 rounded-2xl border p-4"
        >
          <h3 className="text-foreground text-sm font-semibold">{regiao.regiao}</h3>
          <dl className="grid grid-cols-3 gap-2 text-center">
            <div>
              <dt className="text-muted-foreground text-[11px]">Cidades</dt>
              <dd className="text-foreground text-lg font-bold">{regiao.totalCidades}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-[11px]">Bases</dt>
              <dd className="text-foreground text-lg font-bold">{regiao.totalBases}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-[11px]">Executivos</dt>
              <dd className="text-foreground text-lg font-bold">{regiao.totalExecutivos}</dd>
            </div>
          </dl>
        </div>
      ))}
    </div>
  );
}

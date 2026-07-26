import type {
  ResumoBase,
  ResumoExecutivo,
  ResumoGestor,
  ResumoRegiao,
} from "@/modules/atribuicoes/types/atribuicao.types";

interface ResumoSelecaoProps {
  regiao: ResumoRegiao | null;
  base: ResumoBase | null;
  executivo: ResumoExecutivo | null;
  gestor: ResumoGestor | null;
}

interface ItemResumo {
  label: string;
  valor: string | number;
}

function BlocoResumo({ itens }: { itens: ItemResumo[] }) {
  return (
    <>
      {itens.map((item) => (
        <div key={item.label}>
          <p className="text-accent-foreground/70 text-xs font-medium tracking-wide uppercase">
            {item.label}
          </p>
          <p className="text-accent-foreground text-sm font-bold">{item.valor}</p>
        </div>
      ))}
    </>
  );
}

// Banner de destaque quando um filtro de Região/Base/Executivo/Gestor
// está ativo — responde direto "quantas bases tem a região, quantas
// cidades/executivos tem a base, quantos executivos tem o gestor, quantas
// agências tem o executivo" sem precisar procurar na tabela de baixo.
export function ResumoSelecao({ regiao, base, executivo, gestor }: ResumoSelecaoProps) {
  if (!regiao && !base && !executivo && !gestor) return null;

  return (
    <div className="bg-accent flex flex-wrap items-center gap-x-6 gap-y-3 rounded-2xl px-5 py-4">
      {regiao ? (
        <BlocoResumo
          itens={[
            { label: "Região", valor: regiao.regiao },
            { label: "Bases", valor: regiao.totalBases },
            { label: "Executivos", valor: regiao.totalExecutivos },
            { label: "Cidades", valor: regiao.totalCidades },
          ]}
        />
      ) : null}

      {base ? (
        <BlocoResumo
          itens={[
            { label: "Base", valor: base.base },
            { label: "Gestor", valor: base.gestor ?? "—" },
            { label: "Executivos", valor: base.totalExecutivos },
            { label: "Cidades", valor: base.totalCidades },
          ]}
        />
      ) : null}

      {gestor ? (
        <BlocoResumo
          itens={[
            { label: "Gestor", valor: gestor.gestor },
            { label: "Bases", valor: gestor.totalBases },
            { label: "Executivos", valor: gestor.totalExecutivos },
            { label: "Cidades atendidas", valor: gestor.totalCidades },
          ]}
        />
      ) : null}

      {executivo ? (
        <BlocoResumo
          itens={[
            { label: "Executivo", valor: executivo.executivo },
            { label: "Base", valor: executivo.base ?? "—" },
            { label: "Gestor", valor: executivo.gestor ?? "—" },
            { label: "Cidades atendidas", valor: executivo.totalCidades },
            { label: "Agências (exemplo)", valor: executivo.totalAgenciasMock },
          ]}
        />
      ) : null}
    </div>
  );
}

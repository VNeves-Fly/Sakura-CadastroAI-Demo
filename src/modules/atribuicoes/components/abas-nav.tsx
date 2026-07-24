import Link from "next/link";

const ABAS = [
  { chave: "regioes", label: "Regiões" },
  { chave: "bases", label: "Bases" },
  { chave: "executivos", label: "Executivos" },
  { chave: "gestores", label: "Gestores" },
  { chave: "cidades", label: "Cidades" },
  { chave: "remanejar", label: "Remanejar" },
] as const;

interface AbasNavProps {
  abaAtiva: string;
  busca: string;
  regiao: string;
  base: string;
  executivo: string;
  gestor: string;
}

export function AbasNav({ abaAtiva, busca, regiao, base, executivo, gestor }: AbasNavProps) {
  function href(aba: string): string {
    const params = new URLSearchParams();
    params.set("aba", aba);
    if (busca) params.set("busca", busca);
    if (regiao) params.set("regiao", regiao);
    if (base) params.set("base", base);
    if (executivo) params.set("executivo", executivo);
    if (gestor) params.set("gestor", gestor);
    return `/atribuicoes?${params.toString()}`;
  }

  return (
    <div className="border-border flex gap-1 border-b">
      {ABAS.map((aba) => {
        const ativa = aba.chave === abaAtiva;
        return (
          <Link
            key={aba.chave}
            href={href(aba.chave)}
            className={`rounded-t-lg px-4 py-2 text-sm font-medium transition ${
              ativa
                ? "border-primary text-primary border-b-2"
                : "text-muted-foreground hover:text-foreground border-b-2 border-transparent"
            }`}
          >
            {aba.label}
          </Link>
        );
      })}
    </div>
  );
}

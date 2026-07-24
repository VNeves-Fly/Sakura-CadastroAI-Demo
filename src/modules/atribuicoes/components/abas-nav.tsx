import Link from "next/link";

// Ordem reflete a hierarquia comercial de cima pra baixo: Região > Base
// > Gestor > Executivo (decisão do usuário, 2026-07-24). Cidades saiu
// da navegação por enquanto — a aba continua existindo (ver page.tsx),
// só não tem link visível pra chegar nela.
const ABAS = [
  { chave: "regioes", label: "Regiões" },
  { chave: "bases", label: "Bases" },
  { chave: "gestores", label: "Gestores" },
  { chave: "executivos", label: "Executivos" },
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

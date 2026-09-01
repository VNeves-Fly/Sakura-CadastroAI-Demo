import { Plane } from "lucide-react";
import { formatarMoedaCompleta } from "@/modules/agencias-crm/utils/formatar-moeda.util";
import type { TopCompanhiaAgencia } from "@/modules/agencias-crm/types/agencia-detalhe.types";

interface AgenciaTopCompanhiasCardProps {
  companhias: TopCompanhiaAgencia[];
}

// Cor institucional real por companhia (SPEC seção 3.5.B) — o SST devolve
// o nome legal completo em CAIXA ALTA (ex. "AZUL LINHAS AEREAS", "AMERICAN
// AIRLINES INC."), não o nome curto do mockup, então o match é por
// palavra-chave contida no nome (case-insensitive), não igualdade exata.
// Fallback pra hsl(var(--primary)) quando a companhia não está no mapa —
// var(--color-primary) NÃO existe no CSS deste projeto (Tailwind v4 em
// modo compat via tailwind.config.ts, sem bloco @theme que geraria
// --color-*), então usar esse nome quebrava o background silenciosamente.
const CORES_POR_PALAVRA_CHAVE: Array<[string, string]> = [
  ["GOL", "#FF7020"],
  ["AZUL", "#0033A0"],
  ["LATAM", "#E30613"],
  ["IBERIA", "#D7192D"],
  ["LUFTHANSA", "#05164D"],
  ["AIR FRANCE", "#002157"],
  ["UNITED", "#1414AF"],
  ["TAP", "#00A04B"],
  ["AMERICAN", "#0078D2"],
  ["SWISS", "#CC0000"],
];
const COR_FALLBACK = "hsl(var(--primary))";

function resolverCorCompanhia(nome: string): string {
  const nomeNormalizado = nome.toUpperCase();
  const encontrada = CORES_POR_PALAVRA_CHAVE.find(([chave]) => nomeNormalizado.includes(chave));
  return encontrada?.[1] ?? COR_FALLBACK;
}

// Card "Top Companhias Aéreas" (SPEC seção 3.5.B) — `companhias` vem de
// `vendas.topCompanhias`, mock determinístico por hash (repositório de
// DEMONSTRAÇÃO, nunca chama o SST, ver agencia-detalhe.adapter.ts).
// Limitado às 8 primeiras.
// Largura da barra = `participacaoPct` (fatia real sobre o total aéreo
// da agência — aereoNacional + aereoInternacional, mesmo total do card
// "Aéreo" — ver buscarTopCompanhias), não mais relativa ao 1º colocado:
// pedido do usuário, 2026-08-25 ("a distribuição está errada").
export function AgenciaTopCompanhiasCard({ companhias }: AgenciaTopCompanhiasCardProps) {
  const top8 = companhias.slice(0, 8);

  return (
    <div className="border-border rounded-xl border p-[18px_20px]">
      <p className="text-foreground flex items-center gap-2 text-sm font-bold">
        <Plane className="text-primary size-4" />
        Top Companhias Aéreas
      </p>
      <p className="text-muted-foreground text-xs">por volume faturado</p>

      <div className="mt-1">
        {top8.map((companhia, indice) => {
          const cor = resolverCorCompanhia(companhia.nome);
          return (
            <div key={companhia.nome} className="border-border border-t py-2.5">
              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 text-[13.5px] text-[#1A1A2E]">
                  <span className="text-[12px] text-[#9494AC] tabular-nums">{indice + 1}°</span>
                  {companhia.nome}
                </span>
                <span className="text-[13.5px] font-bold text-[#1A1A2E] tabular-nums">
                  {formatarMoedaCompleta(companhia.volume)}
                </span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[#F2F2F8]">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.max(4, Math.round(companhia.participacaoPct))}%`,
                    background: cor,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

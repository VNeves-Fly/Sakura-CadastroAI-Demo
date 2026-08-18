import {
  formatarMoedaAbreviada,
  formatarNumero,
  formatarPercentual,
} from "@/modules/novas-agencias/utils/formatar.util";
import type { ResponsavelRanking } from "@/modules/novas-agencias/types/novas-agencias.types";
import { cn } from "@/lib/utils";

interface CobrancaResponsavelTabelaProps {
  ranking: ResponsavelRanking[];
}

function corContador(valor: number): string {
  return valor > 0 ? "text-orange-600" : "text-muted-foreground";
}

// Tabela de ranking "Cobrança por responsável" (SPEC 10.2) — já recebe o
// array ordenado por "Novas" (desc), decisão de ordenação fica no
// service/view-model, não na tabela.
export function CobrancaResponsavelTabela({ ranking }: CobrancaResponsavelTabelaProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="border-border bg-muted/40 border-b">
          <tr>
            {[
              "Responsável",
              "Novas",
              "Nunca comprou",
              "Logou s/ comprar",
              "Comprando",
              "+15d",
              "+30d",
              "+60d",
              "Conversão",
              "Média até 1ª compra",
              "Volume",
            ].map((coluna) => (
              <th key={coluna} className="text-muted-foreground px-3 py-2.5 font-medium">
                {coluna}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ranking.map((responsavel) => (
            <tr
              key={responsavel.id}
              className={cn(
                "border-border hover:bg-muted/50 border-b transition",
                responsavel.nome === "— sem responsável" && "text-muted-foreground italic",
              )}
            >
              <td className="text-foreground px-3 py-2.5 font-medium whitespace-nowrap">
                {responsavel.nome}
              </td>
              <td className="px-3 py-2.5 whitespace-nowrap">{formatarNumero(responsavel.novas)}</td>
              <td className="px-3 py-2.5 whitespace-nowrap text-red-600">
                {formatarNumero(responsavel.nuncaComprou)}
              </td>
              <td className="px-3 py-2.5 whitespace-nowrap">
                {formatarNumero(responsavel.logouSemComprar)}
              </td>
              <td className="px-3 py-2.5 whitespace-nowrap text-green-600">
                {formatarNumero(responsavel.comprando)}
              </td>
              <td className={cn("px-3 py-2.5 whitespace-nowrap", corContador(responsavel.mais15d))}>
                {responsavel.mais15d}
              </td>
              <td className={cn("px-3 py-2.5 whitespace-nowrap", corContador(responsavel.mais30d))}>
                {responsavel.mais30d}
              </td>
              <td className={cn("px-3 py-2.5 whitespace-nowrap", corContador(responsavel.mais60d))}>
                {responsavel.mais60d}
              </td>
              <td
                className={cn(
                  "px-3 py-2.5 whitespace-nowrap",
                  responsavel.conversaoPct >= 100 && "font-medium text-green-600",
                )}
              >
                {formatarPercentual(responsavel.conversaoPct)}
              </td>
              <td className="px-3 py-2.5 whitespace-nowrap">
                {responsavel.mediaAtePrimeiraCompraDias !== null ? (
                  `${responsavel.mediaAtePrimeiraCompraDias}d`
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </td>
              <td className="text-foreground px-3 py-2.5 font-medium whitespace-nowrap">
                {formatarMoedaAbreviada(responsavel.volume)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

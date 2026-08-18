import { formatarMoeda, formatarPercentual } from "@/modules/novas-agencias/utils/formatar.util";
import { StatusBadge } from "@/modules/novas-agencias/components/status-badge";
import type { AgenciaParandoDeComprar } from "@/modules/novas-agencias/types/novas-agencias.types";

interface AgenciasParandoTabelaProps {
  agencias: AgenciaParandoDeComprar[];
}

function calcularVariacaoPct(pago30d: number, pago30a60d: number): number | null {
  if (pago30a60d === 0) return null;
  return ((pago30d - pago30a60d) / pago30a60d) * 100;
}

// Tabela "Agências parando de comprar" (SPEC 9) — sem filtro/paginação,
// lista completa direto.
export function AgenciasParandoTabela({ agencias }: AgenciasParandoTabelaProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="border-border bg-muted/40 border-b">
          <tr>
            {[
              "Agência",
              "Executivo / Gerente",
              "Última compra",
              "Dias sem comprar",
              "Pago 30d",
              "Pago 30–60d",
              "Variação",
              "Volume total",
              "Situação",
            ].map((coluna) => (
              <th key={coluna} className="text-muted-foreground px-3 py-2.5 font-medium">
                {coluna}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {agencias.map((agencia) => {
            const variacaoPct = calcularVariacaoPct(agencia.pago30d, agencia.pago30a60d);
            return (
              <tr key={agencia.id} className="border-border hover:bg-muted/50 border-b transition">
                <td className="px-3 py-2.5">
                  <p className="text-foreground font-medium whitespace-nowrap">{agencia.nome}</p>
                  <p className="text-muted-foreground text-xs whitespace-nowrap">
                    {agencia.cnpj} · ERP {agencia.erp} · {agencia.cidade}/{agencia.uf}
                  </p>
                </td>
                <td className="px-3 py-2.5 whitespace-nowrap">
                  <p className="text-foreground font-medium">{agencia.executivo}</p>
                  <p className="text-muted-foreground text-xs">{agencia.gerente}</p>
                </td>
                <td className="px-3 py-2.5 whitespace-nowrap">
                  {new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(
                    agencia.ultimaCompra,
                  )}
                </td>
                <td className="px-3 py-2.5 whitespace-nowrap">
                  <span
                    className={agencia.diasSemComprar > 30 ? "text-red-600" : "text-orange-600"}
                  >
                    {agencia.diasSemComprar}d
                  </span>
                </td>
                <td className="px-3 py-2.5 whitespace-nowrap">{formatarMoeda(agencia.pago30d)}</td>
                <td className="px-3 py-2.5 whitespace-nowrap">
                  {formatarMoeda(agencia.pago30a60d)}
                </td>
                <td className="px-3 py-2.5 whitespace-nowrap">
                  {variacaoPct === null ? (
                    <span className="text-muted-foreground">—</span>
                  ) : (
                    <span className={variacaoPct >= 0 ? "text-green-600" : "text-red-600"}>
                      {variacaoPct >= 0 ? "+" : ""}
                      {formatarPercentual(variacaoPct)}
                    </span>
                  )}
                </td>
                <td className="text-foreground px-3 py-2.5 font-medium whitespace-nowrap">
                  {formatarMoeda(agencia.volumeTotal)}
                </td>
                <td className="px-3 py-2.5 whitespace-nowrap">
                  <StatusBadge situacao="comprando" />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

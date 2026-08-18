import { ExternalLink } from "lucide-react";
import { StatusBadge } from "@/modules/novas-agencias/components/status-badge";
import {
  formatarData,
  formatarMoeda,
  formatarMoedaAbreviada,
  formatarNumero,
} from "@/modules/novas-agencias/utils/formatar.util";
import type { AgenciaNova } from "@/modules/novas-agencias/types/novas-agencias.types";

interface ListaAgenciasTabelaProps {
  agencias: AgenciaNova[];
}

// Tabela principal da "Lista de agências" (SPEC 8.3).
export function ListaAgenciasTabela({ agencias }: ListaAgenciasTabelaProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="border-border bg-muted/40 border-b">
          <tr>
            {[
              "Agência",
              "Executivo / Gerente",
              "Entrada",
              "1ª compra",
              "Dias→1ª compra",
              "Última compra",
              "Bilhetes",
              "Volume total",
              "Crédito",
              "Formas de pagamento",
              "Situação",
            ].map((coluna) => (
              <th key={coluna} className="text-muted-foreground px-3 py-2.5 font-medium">
                {coluna}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {agencias.map((agencia) => (
            <tr key={agencia.id} className="border-border hover:bg-muted/50 border-b transition">
              <td className="px-3 py-2.5">
                <p className="text-foreground flex items-center gap-1 font-medium whitespace-nowrap">
                  {agencia.nome}
                  <ExternalLink className="text-muted-foreground/60 size-3" />
                </p>
                <p className="text-muted-foreground text-xs whitespace-nowrap">
                  {agencia.cnpj} · ERP {agencia.erp} · {agencia.cidade}/{agencia.uf}
                </p>
              </td>
              <td className="px-3 py-2.5 whitespace-nowrap">
                <p className="text-foreground font-medium">{agencia.executivo}</p>
                <p className="text-muted-foreground text-xs">{agencia.gerente}</p>
              </td>
              <td className="px-3 py-2.5 whitespace-nowrap">{formatarData(agencia.entrada)}</td>
              <td className="px-3 py-2.5 whitespace-nowrap">
                {formatarData(agencia.primeiraCompra)}
              </td>
              <td className="px-3 py-2.5 whitespace-nowrap">
                {agencia.diasAtePrimeiraCompra ?? <span className="text-muted-foreground">—</span>}
              </td>
              <td className="px-3 py-2.5 whitespace-nowrap">
                {formatarData(agencia.ultimaCompra)}
              </td>
              <td className="px-3 py-2.5 whitespace-nowrap">{formatarNumero(agencia.bilhetes)}</td>
              <td className="text-foreground px-3 py-2.5 font-medium whitespace-nowrap">
                {formatarMoeda(agencia.volumeTotal)}
              </td>
              <td className="px-3 py-2.5 whitespace-nowrap">
                <p className="text-foreground font-medium">
                  {agencia.creditoValor > 0 ? formatarMoedaAbreviada(agencia.creditoValor) : "R$ 0"}
                </p>
                <p className="text-muted-foreground text-xs">{agencia.creditoDetalhe}</p>
              </td>
              <td className="px-3 py-2.5 whitespace-nowrap">
                {agencia.formasPagamento ?? <span className="text-muted-foreground">—</span>}
              </td>
              <td className="px-3 py-2.5 whitespace-nowrap">
                <StatusBadge situacao={agencia.situacao} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

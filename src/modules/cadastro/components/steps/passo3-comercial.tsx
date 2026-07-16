"use client";

import type { useCadastroWizardViewModel } from "@/modules/cadastro/view-models/use-cadastro-wizard.view-model";

type Passo3ComercialProps = ReturnType<typeof useCadastroWizardViewModel>;

const TIPOS_VENDA = [
  { valor: "nacional", label: "Nacional" },
  { valor: "internacional", label: "Internacional" },
  { valor: "terrestre", label: "Terrestre" },
];

// Componente apenas de renderização: recebe estado e callbacks do
// ViewModel do wizard via props.
export function Passo3Comercial({
  vendasTipos,
  vendasPercentuais,
  toggleVendaTipo,
  setVendaPercentual,
}: Passo3ComercialProps) {
  const soma = vendasTipos.reduce((total, tipo) => total + (vendasPercentuais[tipo] ?? 0), 0);
  const somaFechada = Math.round(soma) === 100;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <label className="text-sm font-bold text-foreground">
          Vendas<span className="text-destructive"> *</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {TIPOS_VENDA.map((tipo) => {
            const selecionado = vendasTipos.includes(tipo.valor);
            return (
              <button
                key={tipo.valor}
                type="button"
                onClick={() => toggleVendaTipo(tipo.valor)}
                className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                  selecionado
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-input text-foreground hover:bg-accent"
                }`}
              >
                {tipo.label}
              </button>
            );
          })}
        </div>
        {vendasTipos.length === 0 ? (
          <span className="text-xs font-medium text-destructive">
            Selecione ao menos um tipo de venda.
          </span>
        ) : null}
      </div>

      {vendasTipos.length > 0 ? (
        <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Distribuição percentual
            </span>
            <span
              className={`text-xs font-bold ${somaFechada ? "text-success" : "text-destructive"}`}
            >
              {Math.round(soma)}%
            </span>
          </div>

          {vendasTipos.map((tipoValor) => {
            const tipo = TIPOS_VENDA.find((item) => item.valor === tipoValor);
            const valor = Math.round(vendasPercentuais[tipoValor] ?? 0);

            return (
              <div key={tipoValor} className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">{tipo?.label}</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={valor}
                      onChange={(event) =>
                        setVendaPercentual(tipoValor, Number(event.target.value))
                      }
                      className="w-16 rounded-full border border-input bg-background px-2 py-1 text-right text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-ring/30"
                    />
                    <span className="text-sm text-muted-foreground">%</span>
                  </div>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={valor}
                  onChange={(event) => setVendaPercentual(tipoValor, Number(event.target.value))}
                  className="w-full accent-primary"
                />
              </div>
            );
          })}

          {!somaFechada ? (
            <span className="text-xs font-medium text-destructive">
              A soma precisa fechar em 100%.
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

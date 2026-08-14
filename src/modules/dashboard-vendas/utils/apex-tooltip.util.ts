// Tooltip customizado de gráfico (item 10 do inventário de componentes da
// spec) — ApexCharts espera uma string HTML crua no `tooltip.custom`, não
// dá pra renderizar um componente React ali, então isto é o mais próximo
// de "componente reutilizável" possível: monta o miolo (linha por série +
// total) uma vez só, todo chart com tooltip detalhado (4.3, 4.8) reusa.

export function linhaTooltip(cor: string, label: string, valorTexto: string): string {
  return `
    <div style="display:flex;align-items:center;justify-content:space-between;gap:16px;padding:3px 0;font-size:12px;">
      <span style="display:flex;align-items:center;gap:6px;color:#6B7280;">
        <span style="width:8px;height:8px;border-radius:50%;background:${cor};display:inline-block;"></span>${label}
      </span>
      <span style="font-weight:600;color:#111827;white-space:nowrap;">${valorTexto}</span>
    </div>`;
}

export function wrapperTooltip(titulo: string, linhas: string, linhaTotal?: string): string {
  return `
    <div style="padding:10px 12px;min-width:230px;">
      <p style="font-weight:700;font-size:12px;margin-bottom:4px;color:#111827;">${titulo}</p>
      ${linhas}
      ${
        linhaTotal
          ? `<div style="border-top:1px solid #E5E7EB;margin-top:4px;padding-top:4px;">${linhaTotal}</div>`
          : ""
      }
    </div>`;
}

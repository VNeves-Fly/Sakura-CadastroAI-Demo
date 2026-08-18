interface PillDataInputProps {
  label: string;
  valor: string;
  onChange: (valor: string) => void;
}

// Campo de data no mesmo desenho visual dos pills do `PeriodToggle`
// (bg-muted + rounded-full) — texto livre com máscara dd/mm/aaaa (quem
// aplica a máscara é o chamador, ver mascara-data.util.ts), sem
// calendário: o analista digita a data direto. Usado no filtro
// "Personalizado" — Resumo do dia, Top 10 Agências, Top 10 Fornecedores
// (pedido do usuário, 2026-08-18).
export function PillDataInput({ label, valor, onChange }: PillDataInputProps) {
  return (
    <label className="bg-muted flex items-center gap-1 rounded-full py-1 pr-1 pl-2.5 sm:gap-1.5 sm:py-1.5 sm:pl-3">
      <span className="text-muted-foreground text-[10px] font-bold tracking-wide whitespace-nowrap sm:text-xs">
        {label}
      </span>
      <input
        type="text"
        inputMode="numeric"
        placeholder="dd/mm/aaaa"
        maxLength={10}
        value={valor}
        onChange={(evento) => onChange(evento.target.value)}
        className="bg-card text-foreground placeholder:text-muted-foreground w-20 rounded-full px-1.5 py-1 text-[11px] font-semibold outline-none sm:w-[92px] sm:px-2 sm:text-xs"
      />
    </label>
  );
}

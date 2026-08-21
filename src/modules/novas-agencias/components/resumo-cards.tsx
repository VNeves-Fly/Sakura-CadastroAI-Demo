// Os dois cards de KPI simples da SPEC (seção 7) — "Volume gerado"
// (branco) e "Tempo médio até a 1ª compra" (rosa). Cada um só aparece
// uma vez na tela, por isso ficam no mesmo arquivo em vez de um
// componente genérico reaproveitável.

export function VolumeGeradoCard({ valor }: { valor: string }) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-[#ECECF4] bg-white p-[20px_22px] shadow-[0_1px_2px_rgba(20,20,50,0.04)]">
      <p className="text-[13px] font-medium tracking-[0.03em] text-[#3A3A55] uppercase">
        Volume gerado
      </p>
      <p className="text-[31px] leading-[1.1] font-bold tracking-[-0.02em] text-[#1A1A2E] tabular-nums">
        {valor}
      </p>
      <p className="text-xs text-[#8888AA]">Total transacionado pelas novas agências</p>
    </div>
  );
}

export function TempoMedioCard({ dias }: { dias: number }) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-[#FDE3EF] bg-[#FDF0F7] p-[20px_22px]">
      <p className="text-primary text-[13px] font-medium tracking-[0.03em] uppercase">
        Tempo médio até a 1ª compra
      </p>
      <div className="flex items-baseline gap-2">
        <span className="text-primary text-[31px] leading-[1.1] font-bold tracking-[-0.02em]">
          {dias}
        </span>
        <span className="text-primary text-lg font-bold">dias</span>
      </div>
      <p className="text-primary text-xs opacity-80">
        Contado da entrada do cadastro até a 1ª compra
      </p>
    </div>
  );
}

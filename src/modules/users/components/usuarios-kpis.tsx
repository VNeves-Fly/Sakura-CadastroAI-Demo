interface UsuariosKpisProps {
  total: number;
  ativos: number;
  inativos: number;
  administradores: number;
}

// 4 cards de KPI (SPEC §2.2) — números vêm sempre da lista completa, nunca
// do filtro/busca aplicado na tabela (ver use-usuarios-lista.view-model.ts).
export function UsuariosKpis({ total, ativos, inativos, administradores }: UsuariosKpisProps) {
  const cards = [
    { label: "Total", valor: total, cor: "#16162A" },
    { label: "Ativos", valor: ativos, cor: "#0E9F6E" },
    { label: "Inativos", valor: inativos, cor: "#8A8AA3" },
    { label: "Administradores", valor: administradores, cor: "#E91E8C" },
  ];

  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-3">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-[14px] border border-[#E9E9F2] bg-white px-[18px] py-4"
        >
          <p className="text-[0.72rem] font-semibold tracking-[0.08em] text-[#8A8AA3] uppercase">
            {card.label}
          </p>
          <p
            className="text-[1.5rem] font-extrabold tracking-[-0.02em] tabular-nums"
            style={{ color: card.cor }}
          >
            {card.valor.toLocaleString("pt-BR")}
          </p>
        </div>
      ))}
    </div>
  );
}

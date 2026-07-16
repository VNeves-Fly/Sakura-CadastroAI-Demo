interface WizardStepperProps {
  secoesReveladas: number;
  totalEtapas: number;
  labels: string[];
  onClickSecao: (secao: number) => void;
}

// Indicador de progresso da página única: não existe mais "passo atual"
// isolado — todas as seções reveladas ficam visíveis, empilhadas. Clicar
// numa bolinha rola a página até aquela seção (só funciona pras já reveladas).
export function WizardStepper({
  secoesReveladas,
  totalEtapas,
  labels,
  onClickSecao,
}: WizardStepperProps) {
  const percentualConcluido = Math.round((secoesReveladas / totalEtapas) * 100);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-sm">
        <span className="text-foreground min-w-0 truncate font-semibold">
          Seção {secoesReveladas} de {totalEtapas} — {labels[secoesReveladas - 1] ?? ""}
        </span>
        <span className="text-muted-foreground shrink-0">{percentualConcluido}% concluído</span>
      </div>

      <div className="bg-muted h-2 w-full rounded-full">
        <div
          className="bg-primary h-2 rounded-full transition-all"
          style={{ width: `${percentualConcluido}%` }}
        />
      </div>

      <div className="hidden items-center justify-between sm:flex">
        {labels.map((label, index) => {
          const secao = index + 1;
          const revelada = secao <= secoesReveladas;
          const concluida = secao < secoesReveladas;

          return (
            <button
              key={label}
              type="button"
              disabled={!revelada}
              onClick={() => onClickSecao(secao)}
              className="flex flex-col items-center gap-1 disabled:cursor-not-allowed"
              title={label}
            >
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition ${
                  concluida
                    ? "bg-success text-success-foreground"
                    : revelada
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {concluida ? "✓" : secao}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface WizardStepperProps {
  etapaAtual: number;
  totalEtapas: number;
  maiorEtapaAlcancada: number;
  labels: string[];
  onIrParaEtapa: (etapa: number) => void;
}

export function WizardStepper({
  etapaAtual,
  totalEtapas,
  maiorEtapaAlcancada,
  labels,
  onIrParaEtapa,
}: WizardStepperProps) {
  const labelAtual = labels[etapaAtual - 1] ?? "";
  const percentualConcluido = Math.round((etapaAtual / totalEtapas) * 100);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold text-foreground">
          Passo {etapaAtual} de {totalEtapas} — {labelAtual}
        </span>
        <span className="text-muted-foreground">{percentualConcluido}% concluído</span>
      </div>

      <div className="h-2 w-full rounded-full bg-muted">
        <div
          className="h-2 rounded-full bg-primary transition-all"
          style={{ width: `${percentualConcluido}%` }}
        />
      </div>

      <div className="hidden items-center justify-between sm:flex">
        {labels.map((label, index) => {
          const etapa = index + 1;
          const concluida =
            etapa < maiorEtapaAlcancada || (etapa === maiorEtapaAlcancada && etapa < etapaAtual);
          const ativa = etapa === etapaAtual;

          return (
            <button
              key={label}
              type="button"
              onClick={() => onIrParaEtapa(etapa)}
              className="flex flex-col items-center gap-1"
              title={label}
            >
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition ${
                  ativa
                    ? "bg-primary text-primary-foreground"
                    : concluida
                      ? "bg-success text-success-foreground"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {concluida ? "✓" : etapa}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

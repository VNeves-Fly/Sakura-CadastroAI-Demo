"use client";

import { useEventos } from "@/modules/eventos/view-models/use-eventos.view-model";
import { CriarEventoForm } from "@/modules/eventos/components/criar-evento-form";
import { EventoCard } from "@/modules/eventos/components/evento-card";
import { CadastroPadraoCard } from "@/modules/eventos/components/cadastro-padrao-card";
import type { Executivo, AssociacaoOpcao } from "@/modules/eventos/types/evento.types";

interface EventosViewProps {
  executivos: Executivo[];
  associacoes: AssociacaoOpcao[];
}

export function EventosView({ executivos, associacoes }: EventosViewProps) {
  const { eventos, isLoading, isSalvando, hasError, criarEvento } = useEventos();

  if (isLoading) {
    return (
      <div className="text-muted-foreground flex flex-1 items-center justify-center text-sm">
        Carregando eventos...
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="text-destructive flex flex-1 items-center justify-center text-sm">
        Não foi possível carregar os eventos.
      </div>
    );
  }

  return (
    <div className="flex w-full max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-foreground text-lg font-bold">Eventos</h1>
        <p className="text-muted-foreground text-sm">
          Crie links personalizados por executivo e/ou associação — toda agência cadastrada por um
          desses links carrega a atribuição correspondente automaticamente.
        </p>
      </div>

      <CadastroPadraoCard executivos={executivos} associacoes={associacoes} />

      <CriarEventoForm isSalvando={isSalvando} onCriar={criarEvento} />

      {eventos.length === 0 ? (
        <p className="text-muted-foreground text-sm">Nenhum evento criado ainda.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {eventos.map((evento) => (
            <EventoCard
              key={evento.id}
              evento={evento}
              executivos={executivos}
              associacoes={associacoes}
            />
          ))}
        </div>
      )}
    </div>
  );
}

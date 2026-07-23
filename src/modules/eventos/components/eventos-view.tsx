"use client";

import { useEventos } from "@/modules/eventos/view-models/use-eventos.view-model";
import { CriarEventoForm } from "@/modules/eventos/components/criar-evento-form";
import { EventoCard } from "@/modules/eventos/components/evento-card";

export function EventosView() {
  const {
    eventos,
    executivos,
    isLoading,
    isSalvando,
    hasError,
    criarEvento,
    criarEventoLink,
    alternarAtivoLink,
  } = useEventos();

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
          Crie links de afiliado por executivo — toda agência cadastrada pelo link carrega a tag do
          executivo dono.
        </p>
      </div>

      <CriarEventoForm isSalvando={isSalvando} onCriar={(nome) => criarEvento({ nome })} />

      {eventos.length === 0 ? (
        <p className="text-muted-foreground text-sm">Nenhum evento criado ainda.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {eventos.map((evento) => (
            <EventoCard
              key={evento.id}
              evento={evento}
              executivos={executivos}
              isSalvando={isSalvando}
              onCriarLink={(executivoId) => criarEventoLink({ eventoId: evento.id, executivoId })}
              onAlternarAtivoLink={alternarAtivoLink}
            />
          ))}
        </div>
      )}
    </div>
  );
}

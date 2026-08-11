"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import type { PapelSignatarioPadrao } from "@/modules/cadastro/domain/enums";
import { labelPapelSignatarioPadrao } from "@/modules/admin/utils/papel-signatario-padrao.util";

// Shape enxuto de apresentação (não a entidade de domínio) — só os campos
// que esta lista precisa, montado em page.tsx a partir de
// SignatarioPadrao.toJSON() antes de cruzar a fronteira Server→Client.
export interface SignatarioPadraoAtivoView {
  id: string;
  nome: string | null;
  email: string | null;
  papel: PapelSignatarioPadrao;
}

interface SignatariosPadraoDragListProps {
  signatarios: SignatarioPadraoAtivoView[];
  reordenarAction: (idsEmOrdem: string[]) => Promise<void>;
  removerAction: (id: string) => Promise<void>;
}

// Fila de assinatura arrastável (decisão do usuário, 2026-07-31): a posição
// visual É a ordem real de assinatura no D4Sign — cada linha vira um
// estágio sequencial (ver ReordenarSignatariosPadraoUseCase). Estado local
// pra feedback otimista instantâneo no drop; resincroniza com o servidor
// via `useEffect` depois do `router.refresh()` (revalidatePath sozinho não
// atualiza este Client Component, que segura sua própria cópia da lista).
export function SignatariosPadraoDragList({
  signatarios,
  reordenarAction,
  removerAction,
}: SignatariosPadraoDragListProps) {
  const router = useRouter();
  const [itens, setItens] = useState(signatarios);
  const [erro, setErro] = useState<string | null>(null);
  const [pendenteId, setPendenteId] = useState<string | null>(null);

  useEffect(() => {
    setItens(signatarios);
  }, [signatarios]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const indiceAtual = itens.findIndex((item) => item.id === active.id);
    const indiceNovo = itens.findIndex((item) => item.id === over.id);
    const anterior = itens;
    const reordenados = arrayMove(itens, indiceAtual, indiceNovo);
    setItens(reordenados);
    setErro(null);

    try {
      await reordenarAction(reordenados.map((item) => item.id));
      router.refresh();
    } catch {
      setItens(anterior);
      setErro("A lista mudou enquanto você reordenava — atualize a página e tente de novo.");
    }
  }

  async function handleRemover(id: string) {
    setPendenteId(id);
    setErro(null);
    try {
      await removerAction(id);
      setItens((atuais) => atuais.filter((item) => item.id !== id));
      router.refresh();
    } catch {
      setErro("Não foi possível remover esse signatário — tente de novo.");
    } finally {
      setPendenteId(null);
    }
  }

  if (itens.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-1 py-10 text-center">
        <p className="text-foreground text-sm font-medium">Nenhum signatário ativo.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {erro ? (
        <p className="border-destructive/30 bg-destructive/5 text-destructive rounded-xl border px-3 py-2 text-xs">
          {erro}
        </p>
      ) : null}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext
          items={itens.map((item) => item.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="flex flex-col gap-2">
            {itens.map((item, index) => (
              <SignatarioRow
                key={item.id}
                signatario={item}
                posicao={index + 1}
                removendo={pendenteId === item.id}
                onRemover={() => handleRemover(item.id)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}

function SignatarioRow({
  signatario,
  posicao,
  removendo,
  onRemover,
}: {
  signatario: SignatarioPadraoAtivoView;
  posicao: number;
  removendo: boolean;
  onRemover: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: signatario.id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="border-border bg-card flex items-center gap-3 rounded-xl border px-3 py-2.5"
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label={`Arrastar para reordenar ${signatario.nome ?? signatario.email ?? "signatário"}`}
        className="text-muted-foreground hover:text-foreground shrink-0 cursor-grab touch-none rounded p-1 active:cursor-grabbing"
      >
        <GripVertical className="size-4" />
      </button>

      <span className="bg-primary/10 text-primary flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold">
        {posicao}
      </span>

      <div className="min-w-0 flex-1">
        <span className="text-foreground truncate text-sm font-medium">
          {signatario.nome ?? "—"}
        </span>
        <p className="text-muted-foreground truncate text-xs">{signatario.email ?? "—"}</p>
      </div>

      <span className="bg-primary/10 text-primary hidden shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium sm:inline-block">
        {labelPapelSignatarioPadrao(signatario.papel)}
      </span>

      <div className="flex shrink-0 items-center gap-3">
        <Link
          href={`/cadastros/signatarios-padrao/${signatario.id}`}
          className="text-primary text-xs font-semibold hover:underline"
        >
          Editar
        </Link>
        <button
          type="button"
          onClick={onRemover}
          disabled={removendo}
          className="text-destructive text-xs font-semibold hover:underline disabled:cursor-not-allowed disabled:opacity-50"
        >
          {removendo ? "Removendo..." : "Remover"}
        </button>
      </div>
    </div>
  );
}

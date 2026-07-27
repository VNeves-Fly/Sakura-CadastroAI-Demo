"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useToastStore } from "@/modules/shared/stores/toast.store";

// Rajadas de eventos (ex.: importação em lote) viram um único toast +
// refresh, em vez de um por evento.
const DEBOUNCE_MS = 1_000;

// Sem UI própria — só assina /api/cadastros/eventos e reage (toast +
// router.refresh() pra reaproveitar a query já feita pelo Server Component
// da página, sem duplicar lógica de listagem no client).
export function CadastrosLive() {
  const router = useRouter();
  const mostrarToast = useToastStore((state) => state.mostrarToast);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const quantidadeRef = useRef(0);
  const temNovoRef = useRef(false);

  useEffect(() => {
    const eventSource = new EventSource("/api/cadastros/eventos");

    eventSource.onmessage = (event) => {
      try {
        const dados = JSON.parse(event.data) as { tipo?: string };
        if (dados.tipo === "INSERT") temNovoRef.current = true;
      } catch {
        // ignora payload malformado, ainda assim dispara o refresh
      }

      quantidadeRef.current += 1;
      if (debounceRef.current) clearTimeout(debounceRef.current);

      debounceRef.current = setTimeout(() => {
        const quantidade = quantidadeRef.current;
        const temNovo = temNovoRef.current;
        quantidadeRef.current = 0;
        temNovoRef.current = false;

        if (temNovo) {
          mostrarToast(
            quantidade === 1
              ? "Novo cadastro recebido."
              : `${quantidade} cadastros novos ou atualizados.`,
          );
        } else {
          mostrarToast(
            quantidade === 1
              ? "Um cadastro foi atualizado."
              : `${quantidade} cadastros atualizados.`,
          );
        }

        router.refresh();
      }, DEBOUNCE_MS);
    };

    return () => {
      eventSource.close();
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [router, mostrarToast]);

  return null;
}

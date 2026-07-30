"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useToastStore } from "@/modules/shared/stores/toast.store";

// Rajadas de eventos (ex.: importação em lote) viram um único toast +
// refresh, em vez de um por evento.
const DEBOUNCE_MS = 1_000;

interface EventoCadastro {
  tipo?: "INSERT" | "UPDATE";
  agenciaId?: string;
  razaoSocial?: string | null;
}

interface NovoCadastro {
  agenciaId: string;
  razaoSocial: string | null;
}

// Sem UI própria — só assina /api/cadastros/eventos e reage (toast +
// router.refresh() pra reaproveitar a query já feita pelo Server Component
// da página, sem duplicar lógica de listagem no client).
export function CadastrosLive() {
  const router = useRouter();
  const mostrarToast = useToastStore((state) => state.mostrarToast);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const quantidadeAtualizacoesRef = useRef(0);
  const novosRef = useRef<NovoCadastro[]>([]);

  useEffect(() => {
    const eventSource = new EventSource("/api/cadastros/eventos");

    eventSource.onmessage = (event) => {
      try {
        const dados = JSON.parse(event.data) as EventoCadastro;
        if (dados.tipo === "INSERT" && dados.agenciaId) {
          novosRef.current.push({
            agenciaId: dados.agenciaId,
            razaoSocial: dados.razaoSocial ?? null,
          });
        } else {
          quantidadeAtualizacoesRef.current += 1;
        }
      } catch {
        // payload malformado — conta como atualização genérica, ainda
        // assim dispara o refresh
        quantidadeAtualizacoesRef.current += 1;
      }

      if (debounceRef.current) clearTimeout(debounceRef.current);

      debounceRef.current = setTimeout(() => {
        const novos = novosRef.current;
        const quantidadeAtualizacoes = quantidadeAtualizacoesRef.current;
        novosRef.current = [];
        quantidadeAtualizacoesRef.current = 0;

        const [novo] = novos;
        if (novo && novos.length === 1 && quantidadeAtualizacoes === 0) {
          mostrarToast(novo.razaoSocial ?? "Nova agência cadastrada.", "info", {
            titulo: "🌸 Novo cadastro",
            acao: { label: "Ver", href: `/cadastros/${novo.agenciaId}` },
          });
        } else if (novos.length > 0) {
          mostrarToast(`${novos.length + quantidadeAtualizacoes} cadastros novos ou atualizados.`);
        } else if (quantidadeAtualizacoes === 1) {
          mostrarToast("Um cadastro foi atualizado.");
        } else {
          mostrarToast(`${quantidadeAtualizacoes} cadastros atualizados.`);
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

"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useToastStore } from "@/modules/shared/stores/toast.store";

const DEBOUNCE_MS = 1_000;

const MENSAGEM_POR_TABELA: Record<string, string> = {
  agencias: "Dados da agência atualizados.",
  documentos: "Um documento foi atualizado.",
  contratos: "O contrato foi atualizado.",
  representantes_legais: "Um sócio foi atualizado.",
};

interface CadastroDetalheLiveProps {
  agenciaId: string;
}

// Sem UI própria — assina /api/cadastros/[id]/eventos (filtrado por
// agenciaId no servidor) e reage com toast + router.refresh(), pra quem
// está com o dossiê aberto ver mudanças feitas por outro analista (ou pela
// IA em background) sem precisar recarregar a página.
export function CadastroDetalheLive({ agenciaId }: CadastroDetalheLiveProps) {
  const router = useRouter();
  const mostrarToast = useToastStore((state) => state.mostrarToast);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tabelasRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const eventSource = new EventSource(`/api/cadastros/${agenciaId}/eventos`);

    eventSource.onmessage = (event) => {
      try {
        const dados = JSON.parse(event.data) as { tabela?: string };
        if (dados.tabela) tabelasRef.current.add(dados.tabela);
      } catch {
        // ignora payload malformado, ainda assim dispara o refresh
      }

      if (debounceRef.current) clearTimeout(debounceRef.current);

      debounceRef.current = setTimeout(() => {
        const [primeiraTabela] = tabelasRef.current;
        const eraUnicaTabela = tabelasRef.current.size === 1;
        tabelasRef.current = new Set();

        if (eraUnicaTabela && primeiraTabela) {
          mostrarToast(MENSAGEM_POR_TABELA[primeiraTabela] ?? "O cadastro foi atualizado.");
        } else {
          mostrarToast("O cadastro foi atualizado.");
        }

        router.refresh();
      }, DEBOUNCE_MS);
    };

    return () => {
      eventSource.close();
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [agenciaId, router, mostrarToast]);

  return null;
}

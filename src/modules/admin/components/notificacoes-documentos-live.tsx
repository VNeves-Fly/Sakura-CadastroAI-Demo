"use client";

import { useEffect } from "react";
import { useToastStore } from "@/modules/shared/stores/toast.store";

interface EventoNovoDocumento {
  agenciaId: string;
  agenciaNome: string;
  tipoDocumento: string;
  nomeSocio: string | null;
}

// Sem UI própria — assina /api/notificacoes/documentos e mostra um toast
// no canto inferior esquerdo por documento novo (upload inicial, reenvio,
// inserção manual ou mídia do chat vinculada — qualquer origem, ver a
// rota). Montado no layout do admin (não numa página específica) pra
// avisar qualquer analista logado, em qualquer tela.
export function NotificacoesDocumentosLive() {
  const mostrarToast = useToastStore((state) => state.mostrarToast);

  useEffect(() => {
    const eventSource = new EventSource("/api/notificacoes/documentos");

    eventSource.onmessage = (event) => {
      try {
        const dados = JSON.parse(event.data) as EventoNovoDocumento;
        const quem = dados.nomeSocio ? ` (${dados.nomeSocio})` : "";
        mostrarToast(
          `${dados.agenciaNome} enviou ${dados.tipoDocumento}${quem}.`,
          "info",
          "inferior-esquerdo",
        );
      } catch {
        // payload malformado — ignora, sem toast
      }
    };

    return () => eventSource.close();
  }, [mostrarToast]);

  return null;
}

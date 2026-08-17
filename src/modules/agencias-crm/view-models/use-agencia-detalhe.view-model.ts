"use client";

import { useEffect, useState } from "react";
import { agenciaDetalheService } from "@/modules/agencias-crm/services/agencia-detalhe.service";
import type { AgenciaDetalheView } from "@/modules/agencias-crm/types/agencia-detalhe.types";

export type AbaDetalhe = "dados" | "comercial" | "vendas";
export type SubAbaVendas = "visao_geral" | "reservas" | "faturas";

export function useAgenciaDetalheViewModel(agenciaId: string | null) {
  const [detalhe, setDetalhe] = useState<AgenciaDetalheView | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aba, setAba] = useState<AbaDetalhe>("dados");
  const [subAbaVendas, setSubAbaVendas] = useState<SubAbaVendas>("visao_geral");
  const [socioSelecionadoId, setSocioSelecionadoId] = useState<string | null>(null);
  // Toggle "Ativo sistema" (SPEC 4.1) — o comportamento real ao desligar
  // não pôde ser confirmado na inspeção do protótipo original; mock local
  // só troca o rótulo/cor, sem persistir nada.
  const [ativoLocal, setAtivoLocal] = useState<boolean | null>(null);

  useEffect(() => {
    if (!agenciaId) {
      setDetalhe(null);
      setAba("dados");
      setSubAbaVendas("visao_geral");
      setSocioSelecionadoId(null);
      setAtivoLocal(null);
      return;
    }

    let cancelado = false;
    setIsLoading(true);
    setError(null);

    agenciaDetalheService
      .buscar(agenciaId)
      .then((view) => {
        if (cancelado) return;
        setDetalhe(view);
        setAtivoLocal(view.ativoSistema);
        setSocioSelecionadoId(view.dadosDocumentacao.socios[0]?.id ?? null);
      })
      .catch((caughtError: unknown) => {
        if (cancelado) return;
        setError(caughtError instanceof Error ? caughtError.message : "Erro inesperado.");
      })
      .finally(() => {
        if (!cancelado) setIsLoading(false);
      });

    return () => {
      cancelado = true;
    };
  }, [agenciaId]);

  const socioSelecionado =
    detalhe?.dadosDocumentacao.socios.find((socio) => socio.id === socioSelecionadoId) ?? null;

  return {
    detalhe,
    isLoading,
    error,
    aba,
    setAba,
    subAbaVendas,
    setSubAbaVendas,
    socioSelecionado,
    socioSelecionadoId,
    setSocioSelecionadoId,
    ativoLocal: ativoLocal ?? false,
    alternarAtivoLocal: () => setAtivoLocal((atual) => !atual),
  };
}

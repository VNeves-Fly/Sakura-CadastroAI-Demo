"use client";

import Link from "next/link";
import { useState } from "react";
import { GestorForm } from "@/modules/gestores/components/gestor-form";
import { GestorSuccess } from "@/modules/gestores/components/gestor-success";
import type { BaseView } from "@/modules/bases/types/base.types";
import type {
  CreatedGestorResult,
  GestorFormValues,
  GestorView,
} from "@/modules/gestores/types/gestor.types";
import { useGestorNiveisStore } from "@/modules/gestores/stores/gestor-niveis.store";

interface GestorEditViewProps {
  id: string;
  gestor: GestorView;
  basesOptions: BaseView[];
}

// Demo: essa tela não grava mais no banco — o botão "Salvar alterações" só
// simula um sucesso (delay + monta o CreatedGestorResult a partir do que
// foi digitado no form) e mostra a mesma UI de sucesso de sempre. Decisão
// explícita do usuário: nenhuma chamada real de service aqui.
function simularAtualizacao(
  gestorBase: GestorView,
  values: GestorFormValues,
  basesOptions: BaseView[],
): CreatedGestorResult {
  const siglasPorId = new Map(basesOptions.map((base) => [base.id, base.sigla]));
  const gestorAtualizado: GestorView = {
    ...gestorBase,
    nome: values.nome.trim(),
    sica: values.sica.trim() ? Number(values.sica.trim()) : null,
    email: values.email.trim() ? values.email.trim().toLowerCase() : null,
    telefone: values.telefone.trim() ? values.telefone.trim() : null,
    bases: [...new Set(values.baseIds)]
      .map((id) => siglasPorId.get(id))
      .filter((sigla): sigla is string => Boolean(sigla)),
    temAcesso: values.criarAcesso || gestorBase.temAcesso,
  };

  return {
    gestor: gestorAtualizado,
    temporaryPassword: values.criarAcesso && values.useTemporaryPassword ? "demo-1234" : undefined,
  };
}

export function GestorEditView({ id, gestor, basesOptions }: GestorEditViewProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<CreatedGestorResult | null>(null);

  async function submit(values: GestorFormValues) {
    setIsSubmitting(true);
    try {
      // Simula latência de rede sem persistir nada de verdade — demo.
      await new Promise((resolve) => setTimeout(resolve, 400));
      const updated = simularAtualizacao(gestor, values, basesOptions);
      // Nível não existe no backend (ver gestor-nivel.types.ts) — grava só
      // no override local, mesmo comportamento do view-model real.
      if (values.nivel) {
        useGestorNiveisStore.getState().definirNivel(id, values.nivel);
      }
      setResult(updated);
      return true;
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex w-full max-w-2xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-foreground text-xl font-semibold">Editar gestor</h1>
        <Link
          href="/crm/gestores"
          className="text-muted-foreground hover:text-foreground text-xs font-medium"
        >
          ← Voltar pra Gestores
        </Link>
      </div>

      {result ? <GestorSuccess result={result} onDismiss={() => setResult(null)} /> : null}

      <GestorForm
        isSubmitting={isSubmitting}
        error={null}
        onSubmit={submit}
        gestorAtual={gestor}
        submitLabel="Salvar alterações"
        basesOptions={basesOptions}
      />
    </div>
  );
}

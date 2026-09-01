"use client";

import Link from "next/link";
import { useState } from "react";
import { PromotorForm } from "@/modules/atribuicoes/components/promotor-form";
import { PromotorSuccess } from "@/modules/atribuicoes/components/promotor-success";
import type { BaseView } from "@/modules/bases/types/base.types";
import type {
  CreatedPromotorResult,
  GestorOpcao,
  PromotorCrudView,
  PromotorFormValues,
} from "@/modules/atribuicoes/types/promotor-crud.types";

interface PromotorEditViewProps {
  id: string;
  promotor: PromotorCrudView;
  gestoresOptions: GestorOpcao[] | null;
  minhasBasesSiglas?: string[];
  todasBases: BaseView[];
}

// Demo: essa tela não grava mais no banco — o botão "Salvar alterações"
// só simula um sucesso (delay + monta o CreatedPromotorResult a partir do
// que foi digitado no form) e mostra a mesma UI de sucesso de sempre.
// Decisão explícita do usuário: nenhuma chamada real de service aqui.
function simularAtualizacao(
  promotorBase: PromotorCrudView,
  values: PromotorFormValues,
  todasBases: BaseView[],
): CreatedPromotorResult {
  const siglasPorId = new Map(todasBases.map((base) => [base.id, base.sigla]));
  const promotorAtualizado: PromotorCrudView = {
    ...promotorBase,
    nome: values.nome.trim(),
    sica: values.sica.trim() ? Number(values.sica.trim()) : null,
    email: values.email.trim().toLowerCase(),
    telefone: values.telefone.trim() ? values.telefone.trim() : null,
    gestorId: values.gestorId,
    bases: [...new Set(values.baseIds)]
      .map((id) => siglasPorId.get(id))
      .filter((sigla): sigla is string => Boolean(sigla)),
    temAcesso: values.criarAcesso || promotorBase.temAcesso,
  };

  return {
    promotor: promotorAtualizado,
    temporaryPassword: values.criarAcesso && values.useTemporaryPassword ? "demo-1234" : undefined,
  };
}

export function PromotorEditView({
  id,
  promotor,
  gestoresOptions,
  minhasBasesSiglas,
  todasBases,
}: PromotorEditViewProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<CreatedPromotorResult | null>(null);

  async function submit(values: PromotorFormValues) {
    setIsSubmitting(true);
    try {
      // Simula latência de rede sem persistir nada de verdade — demo.
      await new Promise((resolve) => setTimeout(resolve, 400));
      setResult(simularAtualizacao(promotor, values, todasBases));
      return true;
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex w-full max-w-2xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-foreground text-xl font-semibold">Editar executivo</h1>
        <Link
          href={`/crm/executivos/${id}`}
          className="text-muted-foreground hover:text-foreground text-xs font-medium"
        >
          ← Voltar pro perfil do executivo
        </Link>
      </div>

      {result ? <PromotorSuccess result={result} onDismiss={() => setResult(null)} /> : null}

      <PromotorForm
        isSubmitting={isSubmitting}
        error={null}
        onSubmit={submit}
        promotorAtual={promotor}
        submitLabel="Salvar alterações"
        gestoresOptions={gestoresOptions}
        minhasBasesSiglas={minhasBasesSiglas}
        todasBases={todasBases}
      />
    </div>
  );
}

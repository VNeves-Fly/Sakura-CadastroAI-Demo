"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useUpdatePromotorViewModel } from "@/modules/atribuicoes/view-models/use-update-promotor.view-model";
import type { BaseView } from "@/modules/bases/types/base.types";

interface ExecutivoEdicaoModalProps {
  promotorId: string | null;
  onOpenChange: (aberto: boolean) => void;
  // Idem gestor-edicao-modal.tsx: não aparece no form, só serve pra resolver
  // sigla -> id e reenviar os mesmos baseIds no PATCH (update-promotor.schema.ts
  // apaga as bases se baseIds vier vazio).
  todasBases: BaseView[];
}

const inputClassName =
  "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60";

export function ExecutivoEdicaoModal({
  promotorId,
  onOpenChange,
  todasBases,
}: ExecutivoEdicaoModalProps) {
  const { promotor, isLoading, submitError, isSubmitting, submit } =
    useUpdatePromotorViewModel(promotorId);

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");

  useEffect(() => {
    if (!promotor) return;
    setNome(promotor.nome);
    setEmail(promotor.email);
    setTelefone(promotor.telefone ?? "");
  }, [promotor]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!promotor || !promotorId) return;

    const idsPorSigla = new Map(todasBases.map((base) => [base.sigla, base.id]));
    const baseIds = promotor.bases
      .map((sigla) => idsPorSigla.get(sigla))
      .filter((id): id is string => Boolean(id));

    const succeeded = await submit({
      nome,
      sica: promotor.sica !== null ? String(promotor.sica) : "",
      email,
      telefone,
      gestorId: promotor.gestorId ?? "",
      baseIds,
      criarAcesso: false,
      password: "",
      mustChangePassword: false,
      useTemporaryPassword: false,
    });

    if (succeeded) {
      onOpenChange(false);
    }
  }

  return (
    <Dialog open={Boolean(promotorId)} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <span className="text-muted-foreground text-[11px] font-semibold tracking-wide uppercase">
            Editar executivo
          </span>
          <DialogTitle className="text-lg">{promotor?.nome ?? "..."}</DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto p-4">
          {isLoading ? <p className="text-muted-foreground text-sm">Carregando...</p> : null}

          {!isLoading && promotor ? (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label htmlFor="exec-edicao-nome" className="text-foreground text-sm font-medium">
                  Nome do executivo
                </label>
                <input
                  id="exec-edicao-nome"
                  type="text"
                  required
                  value={nome}
                  onChange={(event) => setNome(event.target.value)}
                  className={inputClassName}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="exec-edicao-email"
                    className="text-foreground text-sm font-medium"
                  >
                    E-mail
                  </label>
                  <input
                    id="exec-edicao-email"
                    type="email"
                    required
                    placeholder="nome@sakura.com.br"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className={inputClassName}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="exec-edicao-telefone"
                    className="text-foreground text-sm font-medium"
                  >
                    Telefone
                  </label>
                  <input
                    id="exec-edicao-telefone"
                    type="tel"
                    placeholder="(11) 90000-0000"
                    value={telefone}
                    onChange={(event) => setTelefone(event.target.value)}
                    className={inputClassName}
                  />
                </div>
              </div>

              {submitError ? <p className="text-destructive text-sm">{submitError}</p> : null}

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Salvando..." : "Salvar alterações"}
                </Button>
              </div>
            </form>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

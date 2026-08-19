"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useUpdateGestorViewModel } from "@/modules/gestores/view-models/use-update-gestor.view-model";
import { useNivelDoGestor } from "@/modules/gestores/stores/gestor-niveis.store";
import {
  useGestorStatusStore,
  useAtivoDoGestor,
} from "@/modules/gestores/stores/gestor-status.store";
import { NIVEIS_GESTOR, nivelSeed } from "@/modules/gestores/types/gestor-nivel.types";
import type { GestorNivel } from "@/modules/gestores/types/gestor-nivel.types";
import type { BaseView } from "@/modules/bases/types/base.types";

interface GestorEdicaoModalProps {
  gestorId: string | null;
  // Contagem real de executivos vinculados (calculada em page.tsx a partir
  // de Promotor.gestorId) — mostrada só leitura, ver decisão do usuário
  // 2026-08-19: não dá pra reatribuir executivo por aqui sem tocar backend.
  executivosCount: number;
  onOpenChange: (aberto: boolean) => void;
  // Não aparece no form (a edição rápida não toca em bases), mas é preciso
  // pra resolver sigla -> id e reenviar os mesmos baseIds no PATCH — sem
  // isso o update apagaria as bases do gestor (ver update-gestor.schema.ts).
  basesOptions: BaseView[];
}

const inputClassName =
  "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60";

export function GestorEdicaoModal({
  gestorId,
  executivosCount,
  onOpenChange,
  basesOptions,
}: GestorEdicaoModalProps) {
  const { gestor, isLoading, submitError, isSubmitting, submit } =
    useUpdateGestorViewModel(gestorId);
  const nivelDaStore = useNivelDoGestor(gestorId ?? "");
  const ativoDaStore = useAtivoDoGestor(gestorId ?? "");

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [nivel, setNivel] = useState<GestorNivel>("gerente");
  const [ativo, setAtivo] = useState(true);

  // Repopula o form sempre que o gestor carregado muda (abriu outra linha,
  // ou terminou de buscar) — mesmo formato de paraValoresIniciais do
  // GestorForm, só que via effect porque aqui o dado chega async.
  useEffect(() => {
    if (!gestor) return;
    setNome(gestor.nome);
    setEmail(gestor.email ?? "");
    setTelefone(gestor.telefone ?? "");
    setNivel(nivelDaStore ?? nivelSeed(gestor.id));
    setAtivo(ativoDaStore);
  }, [gestor, nivelDaStore, ativoDaStore]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!gestor || !gestorId) return;

    const idsPorSigla = new Map(basesOptions.map((base) => [base.sigla, base.id]));
    const baseIds = gestor.bases
      .map((sigla) => idsPorSigla.get(sigla))
      .filter((id): id is string => Boolean(id));

    const succeeded = await submit({
      nome,
      email,
      telefone,
      baseIds,
      nivel,
      criarAcesso: false,
      password: "",
      mustChangePassword: false,
      useTemporaryPassword: false,
    });

    if (succeeded) {
      // Nível já é gravado dentro de submit() quando values.nivel existe
      // (ver use-update-gestor.view-model.ts) — só falta o status, que o
      // hook de update não conhece.
      useGestorStatusStore.getState().definirAtivo(gestorId, ativo);
      onOpenChange(false);
    }
  }

  return (
    <Dialog open={Boolean(gestorId)} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <span className="text-muted-foreground text-[11px] font-semibold tracking-wide uppercase">
            Editar gerente
          </span>
          <DialogTitle className="text-lg">{gestor?.nome ?? "..."}</DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto p-4">
          {isLoading ? <p className="text-muted-foreground text-sm">Carregando...</p> : null}

          {!isLoading && gestor ? (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label htmlFor="edicao-nome" className="text-foreground text-sm font-medium">
                  Nome do gerente
                </label>
                <input
                  id="edicao-nome"
                  type="text"
                  required
                  value={nome}
                  onChange={(event) => setNome(event.target.value)}
                  className={inputClassName}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1">
                  <label htmlFor="edicao-nivel" className="text-foreground text-sm font-medium">
                    Nível
                  </label>
                  <select
                    id="edicao-nivel"
                    value={nivel}
                    onChange={(event) => setNivel(event.target.value as GestorNivel)}
                    className={inputClassName}
                  >
                    {NIVEIS_GESTOR.map((opcao) => (
                      <option key={opcao.valor} value={opcao.valor}>
                        {opcao.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="edicao-executivos"
                    className="text-foreground text-sm font-medium"
                  >
                    Executivos
                  </label>
                  <input
                    id="edicao-executivos"
                    type="number"
                    value={executivosCount}
                    disabled
                    title="Contagem real de executivos vinculados — editar o vínculo é feito na tela do Executivo."
                    className={inputClassName}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1">
                  <label htmlFor="edicao-email" className="text-foreground text-sm font-medium">
                    E-mail
                  </label>
                  <input
                    id="edicao-email"
                    type="email"
                    placeholder="nome@sakura.com.br"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className={inputClassName}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label htmlFor="edicao-telefone" className="text-foreground text-sm font-medium">
                    Telefone
                  </label>
                  <input
                    id="edicao-telefone"
                    type="tel"
                    placeholder="(11) 90000-0000"
                    value={telefone}
                    onChange={(event) => setTelefone(event.target.value)}
                    className={inputClassName}
                  />
                </div>
              </div>

              <label className="flex items-center gap-2">
                <Switch checked={ativo} onCheckedChange={setAtivo} />
                <span className="text-foreground text-sm font-medium">Gerente ativo</span>
              </label>

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

"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { useCreateUserViewModel } from "@/modules/users/view-models/use-create-user.view-model";
import { useUpdateUserViewModel } from "@/modules/users/view-models/use-update-user.view-model";
import { useDeactivateUserViewModel } from "@/modules/users/view-models/use-deactivate-user.view-model";
import { useResetUserPasswordViewModel } from "@/modules/users/view-models/use-reset-user-password.view-model";
import { useToastStore } from "@/modules/shared/stores/toast.store";
import { CARGO_OPTIONS } from "@/modules/users/utils/cargo-options";
import { UsuarioRemoverAlert } from "@/modules/users/components/usuario-remover-alert";
import type { Cargo } from "@/modules/users/domain/enums";

interface UsuarioFormModalProps {
  aberto: boolean;
  userId: string | null;
  onOpenChange: (aberto: boolean) => void;
}

const inputClassName =
  "rounded-[10px] border border-[#E4E4EE] px-[0.85rem] py-[0.65rem] text-[0.875rem] text-[#1F1F33] outline-none transition focus:border-[#E91E8C] focus:ring-[3px] focus:ring-[rgba(233,30,140,0.15)]";

const CARGO_ITEMS: Record<string, string> = Object.fromEntries(
  CARGO_OPTIONS.map((option) => [option.value, option.label]),
);

// Cargo default de usuário novo é "Executivo" nesta tela (SPEC §6) — não é
// o mesmo DEFAULT_CARGO ("Analista") usado noutros forms do módulo.
const CARGO_PADRAO_NOVO: Cargo = "EXECUTIVO";

interface FormState {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  cargo: Cargo;
  ativo: boolean;
}

const VALORES_VAZIOS: FormState = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  cargo: CARGO_PADRAO_NOVO,
  ativo: true,
};

// Modal único de criar/editar usuário (SPEC §3) — "Novo usuário" na
// toolbar e "Editar" na linha da tabela abrem isto, com userId decidindo o
// modo (mesmo padrão do GestorCadastroModal/ExecutivoCadastroModal, ver
// gestor-cadastro-modal.tsx). Bloco de senha e "Remover usuário" só
// aparecem no modo edição — um usuário recém-criado ainda não tem conta
// pra receber link de redefinição, e não tem o que remover.
export function UsuarioFormModal({ aberto, userId, onOpenChange }: UsuarioFormModalProps) {
  const modoEdicao = userId !== null;
  const mostrarToast = useToastStore((state) => state.mostrarToast);

  const criacao = useCreateUserViewModel();
  const edicao = useUpdateUserViewModel(userId);
  const resetSenha = useResetUserPasswordViewModel();
  const remover = useDeactivateUserViewModel();

  const [values, setValues] = useState<FormState>(VALORES_VAZIOS);
  const [removerAberto, setRemoverAberto] = useState(false);

  // Repopula o form sempre que abre pra editar outro usuário — mesmo
  // padrão de gestor-edicao-modal.tsx (era um modal separado, agora é só
  // este efeito). Modo criação zera pros valores em branco.
  useEffect(() => {
    if (modoEdicao) {
      if (edicao.user) {
        setValues({
          firstName: edicao.user.firstName,
          lastName: edicao.user.lastName,
          email: edicao.user.email,
          phone: edicao.user.phone,
          cargo: edicao.user.cargo,
          ativo: edicao.user.ativo,
        });
      }
      return;
    }
    if (aberto) setValues(VALORES_VAZIOS);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aberto, modoEdicao, edicao.user]);

  function fechar() {
    onOpenChange(false);
    setRemoverAberto(false);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (modoEdicao) {
      const succeeded = await edicao.submit(values);
      if (succeeded) {
        mostrarToast("Alterações salvas", "sucesso");
        fechar();
      }
      return;
    }

    const succeeded = await criacao.submit(values);
    if (succeeded) {
      mostrarToast("Usuário cadastrado", "sucesso");
      fechar();
    }
  }

  async function handleRedefinirSenha() {
    if (!userId) return;
    await resetSenha.triggerReset(userId);
    mostrarToast(`Link de redefinição enviado para ${values.email}`, "sucesso");
  }

  async function handleConfirmarRemocao() {
    if (!userId) return;
    const succeeded = await remover.deactivate(userId);
    if (succeeded) {
      const nome = `${values.firstName} ${values.lastName}`.trim();
      mostrarToast(`${nome} foi removido`, "sucesso");
      fechar();
    }
  }

  const isSubmitting = modoEdicao ? edicao.isSubmitting : criacao.isSubmitting;
  const submitError = modoEdicao ? edicao.submitError : criacao.error;
  const nomeCompleto = `${values.firstName} ${values.lastName}`.trim();
  // Editar abre mesmo sem `aberto` (o pai só seta userId nesse caso) —
  // mesmo padrão de gestor-cadastro-modal.tsx.
  const dialogAberto = modoEdicao ? true : aberto;

  return (
    <>
      <Dialog open={dialogAberto} onOpenChange={(valor) => (valor ? onOpenChange(true) : fechar())}>
        <DialogContent className="max-h-[88vh] max-w-[620px] overflow-y-auto rounded-[20px] p-0">
          <DialogHeader className="border-b border-[#EFEFF6] pt-[22px] pr-12 pb-4 pl-[26px]">
            <DialogTitle className="text-[1.05rem]">
              {modoEdicao ? nomeCompleto || "..." : "Novo usuário"}
            </DialogTitle>
            <p className="text-[0.8125rem] text-[#6B6B85]">
              {modoEdicao ? values.email : "Preencha os dados para criar o acesso"}
            </p>
          </DialogHeader>

          {modoEdicao && edicao.isLoading ? (
            <p className="px-[26px] py-8 text-sm text-[#8A8AA3]">Carregando...</p>
          ) : null}
          {modoEdicao && edicao.loadError ? (
            <p className="px-[26px] py-8 text-sm text-[#D6336C]">{edicao.loadError}</p>
          ) : null}

          {!modoEdicao || (edicao.user && !edicao.isLoading) ? (
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4 px-[26px] py-[22px]">
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="firstName"
                  className="text-[0.8125rem] font-semibold text-[#3A3A54]"
                >
                  Nome
                </label>
                <input
                  id="firstName"
                  type="text"
                  required
                  placeholder="Nome"
                  value={values.firstName}
                  onChange={(event) => setValues({ ...values, firstName: event.target.value })}
                  className={inputClassName}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="lastName" className="text-[0.8125rem] font-semibold text-[#3A3A54]">
                  Sobrenome
                </label>
                <input
                  id="lastName"
                  type="text"
                  required
                  placeholder="Sobrenome"
                  value={values.lastName}
                  onChange={(event) => setValues({ ...values, lastName: event.target.value })}
                  className={inputClassName}
                />
              </div>

              <div className="col-span-2 flex flex-col gap-1.5">
                <label htmlFor="email" className="text-[0.8125rem] font-semibold text-[#3A3A54]">
                  E-mail
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  placeholder="nome@sakuratur.com.br"
                  value={values.email}
                  onChange={(event) => setValues({ ...values, email: event.target.value })}
                  className={inputClassName}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="phone" className="text-[0.8125rem] font-semibold text-[#3A3A54]">
                  Telefone (WhatsApp)
                </label>
                <input
                  id="phone"
                  type="tel"
                  required
                  placeholder="(11) 91234-5678"
                  value={values.phone}
                  onChange={(event) => setValues({ ...values, phone: event.target.value })}
                  className={`${inputClassName} font-mono`}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="cargo" className="text-[0.8125rem] font-semibold text-[#3A3A54]">
                  Cargo
                </label>
                <Select
                  items={CARGO_ITEMS}
                  value={values.cargo}
                  onValueChange={(valor) =>
                    setValues({ ...values, cargo: (valor ?? CARGO_PADRAO_NOVO) as Cargo })
                  }
                >
                  <SelectTrigger id="cargo" className={inputClassName}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CARGO_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="col-span-2 flex items-center justify-between gap-4 rounded-xl border border-[#EFEFF6] bg-[#FAFAFD] px-4 py-3.5">
                <div>
                  <p className="text-sm font-semibold text-[#16162A]">
                    {values.ativo ? "Usuário ativo" : "Usuário inativo"}
                  </p>
                  <p className="text-[0.8125rem] text-[#6B6B85]">
                    {values.ativo
                      ? "Pode entrar na plataforma normalmente."
                      : "O acesso fica bloqueado até ser reativado."}
                  </p>
                </div>
                <Switch
                  checked={values.ativo}
                  onCheckedChange={(checked) => setValues({ ...values, ativo: checked })}
                  aria-label="Alternar status"
                />
              </div>

              {modoEdicao ? (
                <div className="col-span-2 flex items-center justify-between gap-4 rounded-xl border border-dashed border-[#E4E4EE] px-4 py-3.5">
                  <div>
                    <p className="text-sm font-semibold text-[#16162A]">Senha de acesso</p>
                    <p className="text-[0.8125rem] text-[#6B6B85]">
                      Envia um link de redefinição por e-mail.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleRedefinirSenha}
                    disabled={resetSenha.statusById[userId] === "loading"}
                    className="shrink-0 rounded-full bg-[#2563EB] px-4 py-2 text-[0.8125rem] font-semibold whitespace-nowrap text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {resetSenha.statusById[userId] === "loading"
                      ? "Enviando..."
                      : "Redefinir senha"}
                  </button>
                </div>
              ) : null}

              {submitError ? (
                <p className="col-span-2 text-sm text-[#D6336C]">{submitError}</p>
              ) : null}

              <div className="col-span-2 flex items-center justify-between gap-3 border-t border-[#EFEFF6] pt-4">
                {modoEdicao ? (
                  <button
                    type="button"
                    onClick={() => setRemoverAberto(true)}
                    className="rounded-full px-2 py-1.5 text-[0.8125rem] font-semibold text-[#D6336C] transition hover:bg-[rgba(239,68,68,0.08)]"
                  >
                    Remover usuário
                  </button>
                ) : (
                  <span />
                )}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={fechar}
                    className="rounded-full border border-[#E4E4EE] bg-white px-4 py-2 text-sm font-medium text-[#4A4A63] transition hover:bg-[#F7F7FB]"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="rounded-full bg-[#E91E8C] px-4 py-2 text-sm font-semibold text-white shadow-[0_4px_20px_rgba(233,30,140,0.35)] transition hover:opacity-90 active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSubmitting ? "Salvando..." : modoEdicao ? "Salvar alterações" : "Cadastrar"}
                  </button>
                </div>
              </div>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>

      <UsuarioRemoverAlert
        aberto={removerAberto}
        nomeCompleto={nomeCompleto}
        isSubmitting={remover.isSubmitting}
        onCancel={() => setRemoverAberto(false)}
        onConfirm={handleConfirmarRemocao}
      />
    </>
  );
}

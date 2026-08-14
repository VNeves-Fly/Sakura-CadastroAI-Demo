"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { nextAuthOptions } from "@/modules/auth/presentation/routes/next-auth.options";
import { cadastroAdminController } from "@/modules/cadastro/presentation/controllers/cadastro-admin.controller";
import type { PapelSignatarioPadrao } from "@/modules/cadastro/domain/enums";
import { PAPEL_SIGNATARIO_PADRAO_LABELS } from "@/modules/admin/utils/papel-signatario-padrao.util";
import { DomainError } from "@/modules/shared/domain/errors";

// Server Actions são chamáveis direto (sem passar pela UI), então o guard
// de cargo daqui é o que vale de verdade — o redirect nas pages é só
// conveniência de navegação. Mesmo critério de acesso de /gestores e
// /bases (Admin/Diretor, decisão do usuário 2026-07-31).
const CARGOS_GESTAO_DE_SIGNATARIOS = new Set(["ADMIN", "DIRETOR_ANALISTA"]);

async function exigirAcessoSignatariosPadrao(): Promise<void> {
  const session = await getServerSession(nextAuthOptions);
  if (!session || !CARGOS_GESTAO_DE_SIGNATARIOS.has(session.user.cargo)) {
    throw new DomainError("Acesso não permitido.");
  }
}

// `estagio` não é mais digitado à mão aqui — é sempre calculado (sempre no
// fim da fila atual, ver CriarSignatarioPadraoUseCase/
// RestaurarSignatarioPadraoUseCase) e só muda depois via drag-and-drop
// (reordenarSignatariosPadraoAction). `ordem` foi substituído pela mesma
// fila arrastável — o campo continua existindo na tabela, só não é mais
// lido/escrito por aqui.
function parseFormData(formData: FormData) {
  const nome = String(formData.get("nome") ?? "").trim();
  const cargo = String(formData.get("cargo") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const telefone = String(formData.get("telefone") ?? "").trim();
  const papel = String(formData.get("papel") ?? "") as PapelSignatarioPadrao;

  if (!(papel in PAPEL_SIGNATARIO_PADRAO_LABELS)) {
    throw new Error("Papel inválido.");
  }

  return {
    nome: nome || null,
    cargo: cargo || null,
    email: email || null,
    telefone: telefone || null,
    papel,
  };
}

export async function criarSignatarioPadraoAction(formData: FormData) {
  await exigirAcessoSignatariosPadrao();
  const dados = parseFormData(formData);
  await cadastroAdminController.criarSignatarioPadrao(dados);
  revalidatePath("/cadastros/signatarios-padrao");
  redirect("/cadastros/signatarios-padrao");
}

export async function atualizarSignatarioPadraoAction(id: string, formData: FormData) {
  await exigirAcessoSignatariosPadrao();
  const dados = parseFormData(formData);
  await cadastroAdminController.atualizarSignatarioPadrao({ id, data: dados });
  revalidatePath("/cadastros/signatarios-padrao");
  revalidatePath(`/cadastros/signatarios-padrao/${id}`);
  redirect("/cadastros/signatarios-padrao");
}

export async function removerSignatarioPadraoAction(id: string) {
  await exigirAcessoSignatariosPadrao();
  await cadastroAdminController.removerSignatarioPadrao(id);
  revalidatePath("/cadastros/signatarios-padrao");
}

export async function restaurarSignatarioPadraoAction(id: string) {
  await exigirAcessoSignatariosPadrao();
  await cadastroAdminController.restaurarSignatarioPadrao(id);
  revalidatePath("/cadastros/signatarios-padrao");
}

export async function reordenarSignatariosPadraoAction(idsEmOrdem: string[]) {
  await exigirAcessoSignatariosPadrao();
  await cadastroAdminController.reordenarSignatariosPadrao(idsEmOrdem);
  revalidatePath("/cadastros/signatarios-padrao");
}

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cadastroAdminController } from "@/modules/cadastro/presentation/controllers/cadastro-admin.controller";
import type { PapelSignatarioPadrao } from "@/modules/cadastro/domain/enums";
import { PAPEL_SIGNATARIO_PADRAO_LABELS } from "@/modules/admin/utils/papel-signatario-padrao.util";

function parseFormData(formData: FormData) {
  const nome = String(formData.get("nome") ?? "").trim();
  const cargo = String(formData.get("cargo") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const telefone = String(formData.get("telefone") ?? "").trim();
  const papel = String(formData.get("papel") ?? "") as PapelSignatarioPadrao;
  const estagio = Number(formData.get("estagio"));
  const ordemBruta = formData.get("ordem");
  const ordem = ordemBruta ? Number(ordemBruta) : null;

  if (!(papel in PAPEL_SIGNATARIO_PADRAO_LABELS)) {
    throw new Error("Papel inválido.");
  }
  // Estágio 0 é reservado pros sócios da agência (dinâmico, fora desta
  // tabela) — ver docs/d4sign.md.
  if (!Number.isInteger(estagio) || estagio < 1) {
    throw new Error("Estágio precisa ser um número inteiro >= 1 (0 é reservado pros sócios).");
  }

  return {
    nome: nome || null,
    cargo: cargo || null,
    email: email || null,
    telefone: telefone || null,
    papel,
    estagio,
    ordem,
  };
}

export async function criarSignatarioPadraoAction(formData: FormData) {
  const dados = parseFormData(formData);
  await cadastroAdminController.criarSignatarioPadrao(dados);
  revalidatePath("/painel/signatarios-padrao");
  redirect("/painel/signatarios-padrao");
}

export async function atualizarSignatarioPadraoAction(id: string, formData: FormData) {
  const dados = parseFormData(formData);
  await cadastroAdminController.atualizarSignatarioPadrao({ id, data: dados });
  revalidatePath("/painel/signatarios-padrao");
  revalidatePath(`/painel/signatarios-padrao/${id}`);
  redirect("/painel/signatarios-padrao");
}

export async function removerSignatarioPadraoAction(id: string) {
  await cadastroAdminController.removerSignatarioPadrao(id);
  revalidatePath("/painel/signatarios-padrao");
}

export async function restaurarSignatarioPadraoAction(id: string) {
  await cadastroAdminController.restaurarSignatarioPadrao(id);
  revalidatePath("/painel/signatarios-padrao");
}

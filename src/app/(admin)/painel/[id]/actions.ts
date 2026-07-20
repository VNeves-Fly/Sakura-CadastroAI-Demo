"use server";

import { revalidatePath } from "next/cache";
import { cadastroAdminController } from "@/modules/cadastro/presentation/controllers/cadastro-admin.controller";

// Server Actions do dossiê — cada uma só dispara a ação no controller e
// revalida a própria página do dossiê (sem redirect: o form re-renderiza
// no mesmo lugar já com o novo status).
export async function aprovarComplementarAction(id: string) {
  await cadastroAdminController.aprovarComplementar(id);
  revalidatePath(`/painel/${id}`);
}

export async function marcarContratoAssinadoAction(id: string) {
  await cadastroAdminController.marcarContratoAssinado(id);
  revalidatePath(`/painel/${id}`);
}

export async function validarContratoAction(id: string) {
  await cadastroAdminController.validarContrato(id);
  revalidatePath(`/painel/${id}`);
}

export async function ativarClienteAction(id: string) {
  await cadastroAdminController.ativarCliente(id);
  revalidatePath(`/painel/${id}`);
}

export async function recusarCadastroAction(id: string) {
  await cadastroAdminController.recusarCadastro(id);
  revalidatePath(`/painel/${id}`);
}

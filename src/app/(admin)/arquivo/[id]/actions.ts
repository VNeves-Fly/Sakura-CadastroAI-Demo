"use server";

import { revalidatePath } from "next/cache";
import { cadastroAdminController } from "@/modules/cadastro/presentation/controllers/cadastro-admin.controller";

// Única transição de status permitida a partir do arquivo: Reprovada ->
// Ativa (reaproveita o mesmo use-case genérico de "ativarCliente" — não
// existe o caminho inverso, Ativa não pode virar Reprovada por aqui).
export async function reativarClienteAction(agenciaId: string) {
  await cadastroAdminController.ativarCliente(agenciaId);
  revalidatePath(`/arquivo/${agenciaId}`);
  revalidatePath("/arquivo");
}

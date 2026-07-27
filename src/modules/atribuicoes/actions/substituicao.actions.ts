"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { atribuicoesAdminController } from "@/modules/atribuicoes/presentation/controllers/atribuicoes-admin.controller";

const ABA_POR_TIPO: Record<"executivo" | "gestor" | "base", string> = {
  executivo: "executivos",
  gestor: "gestores",
  base: "bases",
};

function normalizarTipo(valor: FormDataEntryValue | null): "executivo" | "gestor" | "base" {
  if (valor === "gestor") return "gestor";
  if (valor === "base") return "base";
  return "executivo";
}

export async function substituirAction(formData: FormData) {
  const tipo = normalizarTipo(formData.get("tipo"));
  const nomeAntigo = String(formData.get("nomeAntigo") ?? "").trim();
  const nomeExistente = String(formData.get("nomeExistente") ?? "").trim();
  const nomeNovoDigitado = String(formData.get("nomeNovo") ?? "").trim();
  const nomeNovo = nomeExistente || nomeNovoDigitado;

  if (!nomeAntigo || !nomeNovo) {
    redirect(
      `/atribuicoes/substituir?tipo=${tipo}&nome=${encodeURIComponent(nomeAntigo)}&erro=informe-o-substituto`,
    );
  }

  if (nomeNovo === nomeAntigo) {
    redirect(
      `/atribuicoes/substituir?tipo=${tipo}&nome=${encodeURIComponent(nomeAntigo)}&erro=substituto-igual-ao-atual`,
    );
  }

  await atribuicoesAdminController.substituirAtribuicao({ tipo, nomeAntigo, nomeNovo });

  revalidatePath("/atribuicoes");
  redirect(`/atribuicoes?aba=${ABA_POR_TIPO[tipo]}`);
}

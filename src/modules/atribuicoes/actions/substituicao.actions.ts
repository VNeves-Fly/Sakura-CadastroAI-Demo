"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  substituirExecutivo,
  substituirGestor,
} from "@/modules/atribuicoes/services/atribuicoes-store";

export async function substituirAction(formData: FormData) {
  const tipo = formData.get("tipo") === "gestor" ? "gestor" : "executivo";
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

  if (tipo === "gestor") {
    substituirGestor(nomeAntigo, nomeNovo);
  } else {
    substituirExecutivo(nomeAntigo, nomeNovo);
  }

  revalidatePath("/atribuicoes");
  redirect(`/atribuicoes?aba=${tipo === "gestor" ? "gestores" : "executivos"}`);
}

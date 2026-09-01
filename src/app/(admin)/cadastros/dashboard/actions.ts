"use server";

import { getServerSession } from "next-auth";
import { nextAuthOptions } from "@/modules/auth/presentation/routes/next-auth.options";
import { cadastroAdminController } from "@/modules/cadastro/presentation/controllers/cadastro-admin.controller";

const TAMANHO_PAGINA = 20;

async function garantirAcesso(): Promise<void> {
  const session = await getServerSession(nextAuthOptions);
  if (!session) {
    throw new Error("Acesso não permitido.");
  }
}

// Modal "Ver mais" de Últimas Movimentações — a lista principal já mostra
// as 5 mais recentes (ver UltimasMovimentacoesList), esta action navega o
// restante do histórico. Sem restrição de cargo: a tela é visível pra
// qualquer cargo autenticado (diferente de telas como Logs de e-mail).
export async function listarUltimasMovimentacoesEtapaAction(pagina: number) {
  await garantirAcesso();
  const paginaSegura = Math.max(1, Math.trunc(pagina) || 1);
  return cadastroAdminController.listarUltimasMovimentacoesEtapaPaginado(
    paginaSegura,
    TAMANHO_PAGINA,
  );
}

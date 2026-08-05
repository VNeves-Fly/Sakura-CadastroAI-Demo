import { getServerSession } from "next-auth";
import { nextAuthOptions } from "@/modules/auth/presentation/routes/next-auth.options";
import type { Cargo } from "@/modules/users/domain/enums";

export interface SessaoUsuario {
  id: string;
  cargo: Cargo;
}

// Único ponto de leitura de sessão pros guards de cargo — usado pelas API
// routes de gestores/promotores (Admin/Diretor only) e pelo bloqueio de
// atendimento (Gestor/Executivo not allowed). Guard de UI (sidebar/página)
// não substitui isso: API routes são chamáveis direto, sem passar pela tela.
export async function obterSessaoUsuario(): Promise<SessaoUsuario | null> {
  const session = await getServerSession(nextAuthOptions);
  if (!session?.user?.id || !session.user.cargo) return null;
  return { id: session.user.id, cargo: session.user.cargo };
}

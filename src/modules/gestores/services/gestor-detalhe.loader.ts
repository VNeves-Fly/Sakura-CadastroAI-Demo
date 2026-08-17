import { gestoresController } from "@/modules/gestores/presentation/controllers/gestores.controller";
import { atribuicoesAdminController } from "@/modules/atribuicoes/presentation/controllers/atribuicoes-admin.controller";
import type {
  ExecutivoComCarteira,
  GestorRaw,
} from "@/modules/gestores/adapters/gestor-detalhe.adapter";

export interface GestorComExecutivos {
  gestor: GestorRaw;
  executivos: ExecutivoComCarteira[];
}

// Carrega o gestor + a carteira completa dos executivos subordinados a ele
// (agências reais via Promotor.gestorId) — usado por todas as abas do
// detalhe do gestor (Dashboard/Executivos/Agenda/Agências), server-side,
// pra não duplicar essa busca em cada page.tsx. Retorna null se o gestor
// não existir (chamador decide se chama notFound()).
export async function carregarGestorComExecutivos(
  gestorId: string,
): Promise<GestorComExecutivos | null> {
  const gestor = await gestoresController.getById(gestorId).catch(() => null);
  if (!gestor) return null;

  const promotores = await atribuicoesAdminController.listarPromotores();
  const subordinados = promotores.filter((promotor) => promotor.gestorId === gestor.id);

  const executivos = await Promise.all(
    subordinados.map(async (promotor) => ({
      id: promotor.id,
      nome: promotor.nome,
      email: promotor.email,
      sica: promotor.sica,
      bases: promotor.bases,
      agencias: await atribuicoesAdminController.listarAgenciasPorPromotor(promotor.id),
    })),
  );

  return { gestor, executivos };
}

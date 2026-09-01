import {
  buscarGestorMockPorId,
  listarExecutivosMockPorGestor,
} from "@/modules/crm-mock/pessoas.mock-data";
import { listarAgenciasMockDoExecutivo } from "@/modules/atribuicoes/adapters/executivo-detalhe.adapter";
import type {
  ExecutivoComCarteira,
  GestorRaw,
} from "@/modules/gestores/adapters/gestor-detalhe.adapter";

export interface GestorComExecutivos {
  gestor: GestorRaw;
  executivos: ExecutivoComCarteira[];
}

// Carrega o gestor + a carteira completa dos executivos subordinados a ele
// — usado por todas as abas do detalhe do gestor (Dashboard/Executivos/
// Agenda/Agências), server-side, pra não duplicar essa busca em cada
// page.tsx. Retorna null se o gestor não existir (chamador decide se chama
// notFound()). Dados fictícios (demo): nunca lê do Postgres real, ver
// crm-mock/pessoas.mock-data.ts / crm-mock/agencias.mock-data.ts.
export async function carregarGestorComExecutivos(
  gestorId: string,
): Promise<GestorComExecutivos | null> {
  const gestorMock = buscarGestorMockPorId(gestorId);
  if (!gestorMock) return null;

  const gestor: GestorRaw = {
    id: gestorMock.id,
    nome: gestorMock.nome,
    email: gestorMock.email,
    telefone: gestorMock.telefone,
    bases: gestorMock.bases,
  };

  const subordinados = listarExecutivosMockPorGestor(gestorMock.id);

  const executivos: ExecutivoComCarteira[] = subordinados.map((promotor) => ({
    id: promotor.id,
    nome: promotor.nome,
    email: promotor.email,
    sica: promotor.sica,
    bases: promotor.bases,
    agencias: listarAgenciasMockDoExecutivo(promotor.nome),
  }));

  return { gestor, executivos };
}

import { NovasAgenciasView } from "@/modules/novas-agencias/views/novas-agencias-view";
import type { NovasAgenciasData } from "@/modules/novas-agencias/types/novas-agencias.types";

interface NovasAgenciasSecaoProps {
  dadosPromise: Promise<NovasAgenciasData>;
  carregadoEm: string;
}

// Server Component async — a page.tsx dispara
// novasAgenciasController.obterNovasAgencias() sem `await` e passa a
// promise pra cá dentro de um <Suspense>; só este componente espera ela
// resolver, então o Suspense troca o skeleton pelo conteúdo real quando
// o banco local + as métricas do SST terminarem de carregar, sem
// bloquear a abertura da página. Mesmo padrão de agencias-lista-secao.tsx.
export async function NovasAgenciasSecao({ dadosPromise, carregadoEm }: NovasAgenciasSecaoProps) {
  const dados = await dadosPromise;
  return <NovasAgenciasView dados={dados} carregadoEm={carregadoEm} />;
}

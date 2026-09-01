import { TvView } from "@/modules/tv/components/tv-view";
import type { TvData } from "@/modules/tv/types/tv.types";

interface TvSecaoProps {
  dadosPromise: Promise<TvData>;
}

// Server Component async — a page.tsx dispara tvController.obterDados()
// sem `await` e passa a promise pra cá dentro de um <Suspense>; só este
// componente espera ela resolver, então o Suspense troca o TvSkeleton
// pelo painel real assim que os dados mock (ver tv.mock-service.ts)
// resolverem, sem bloquear a abertura da página (mesmo padrão de
// AgenciasListaSecao, ver agencias-lista-secao.tsx).
export async function TvSecao({ dadosPromise }: TvSecaoProps) {
  const dados = await dadosPromise;
  return <TvView dados={dados} />;
}

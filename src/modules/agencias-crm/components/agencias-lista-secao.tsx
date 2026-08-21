import { AgenciasListaView } from "@/modules/agencias-crm/views/agencias-lista-view";
import type { AgenciaCarteiraView } from "@/modules/agencias-crm/types/agencia-carteira.types";

interface AgenciasListaSecaoProps {
  agenciasPromise: Promise<AgenciaCarteiraView[]>;
  atualizadoEm: string;
}

// Server Component async — a page.tsx dispara carregarAgenciasCarteira()
// sem `await` e passa a promise pra cá dentro de um <Suspense>; só este
// componente espera ela resolver, então o Suspense troca o skeleton pelo
// conteúdo real quando a carteira (banco local + métricas do SST)
// terminar de carregar, sem bloquear o resto da página.
export async function AgenciasListaSecao({
  agenciasPromise,
  atualizadoEm,
}: AgenciasListaSecaoProps) {
  const agencias = await agenciasPromise;
  return <AgenciasListaView agencias={agencias} atualizadoEm={atualizadoEm} />;
}

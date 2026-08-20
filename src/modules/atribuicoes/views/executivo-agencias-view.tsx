import type { ReactNode } from "react";
import { ExecutivoProfileHeader } from "@/modules/atribuicoes/components/executivo/executivo-profile-header";
import { ExecutivoTabsNav } from "@/modules/atribuicoes/components/executivo/executivo-tabs-nav";
import type { ExecutivoPerfil } from "@/modules/atribuicoes/types/executivo-detalhe.types";

interface ExecutivoAgenciasViewProps {
  perfil: ExecutivoPerfil;
  // Elementos já resolvidos/streamados pelo Server Component pai
  // (page.tsx) — este shell é 100% síncrono, nunca busca SST ele mesmo
  // (ver criarExecutivoHeaderStatsSlots/agencias-carteira-secao.tsx). A
  // interatividade (filtros/tabela) vive em `carteiraSlot`, atrás do seu
  // próprio Suspense.
  statsAgenciasSlot?: ReactNode;
  statsVendendo30dSlot?: ReactNode;
  carteiraSlot: ReactNode;
}

export function ExecutivoAgenciasView({
  perfil,
  statsAgenciasSlot,
  statsVendendo30dSlot,
  carteiraSlot,
}: ExecutivoAgenciasViewProps) {
  return (
    <div className="flex w-full flex-col gap-5">
      <h1 className="text-foreground text-xl font-semibold">Detalhes do Executivo</h1>
      <ExecutivoProfileHeader
        perfil={perfil}
        statsAgenciasSlot={statsAgenciasSlot}
        statsVendendo30dSlot={statsVendendo30dSlot}
      />
      <ExecutivoTabsNav executivoId={perfil.id} abaAtiva="agencias" />

      {carteiraSlot}
    </div>
  );
}

import { Suspense } from "react";
import { GestorDetalheShell } from "@/modules/gestores/components/gestor-detalhe-shell";
import { GestorExecutivosSecao } from "@/modules/gestores/components/gestor-executivos-secao";
import { SecaoSkeleton } from "@/modules/gestores/components/dashboard/secao-skeleton";
import type { gestorDashboardController } from "@/modules/gestores/presentation/controllers/gestor-dashboard.controller";
import type { GestorPerfil } from "@/modules/gestores/types/gestor-detalhe.types";
import type { ExecutivoComCarteira } from "@/modules/gestores/adapters/gestor-detalhe.adapter";

interface GestorExecutivosViewProps {
  perfil: GestorPerfil;
  executivosBase: ExecutivoComCarteira[];
  agregadoPromise: ReturnType<typeof gestorDashboardController.obterAgregadoCompleto>;
}

// A página abre com o shell (header/tabs) na hora do clique — a tabela,
// que depende do agregado pesado (SST por executivo), só chega depois via
// Suspense. Mesmo padrão de gestor-dashboard-view.tsx.
export function GestorExecutivosView({
  perfil,
  executivosBase,
  agregadoPromise,
}: GestorExecutivosViewProps) {
  return (
    <GestorDetalheShell perfil={perfil} abaAtiva="executivos">
      <Suspense fallback={<SecaoSkeleton altura="h-96" />}>
        <GestorExecutivosSecao executivosBase={executivosBase} agregadoPromise={agregadoPromise} />
      </Suspense>
    </GestorDetalheShell>
  );
}

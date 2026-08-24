import { Suspense } from "react";
import { GestorDetalheShell } from "@/modules/gestores/components/gestor-detalhe-shell";
import { GestorAgenciasSecao } from "@/modules/gestores/components/gestor-agencias-secao";
import { SecaoSkeleton } from "@/modules/gestores/components/dashboard/secao-skeleton";
import type { gestorDashboardController } from "@/modules/gestores/presentation/controllers/gestor-dashboard.controller";
import type { GestorPerfil } from "@/modules/gestores/types/gestor-detalhe.types";
import type { ExecutivoComCarteira } from "@/modules/gestores/adapters/gestor-detalhe.adapter";

interface GestorAgenciasViewProps {
  perfil: GestorPerfil;
  executivos: ExecutivoComCarteira[];
  agregadoPromise: ReturnType<typeof gestorDashboardController.obterAgregadoCompleto>;
}

// A página abre com o shell (header/tabs) na hora do clique — a tabela,
// que depende do agregado pesado (SST por executivo), só chega depois via
// Suspense. Mesmo padrão de gestor-dashboard-view.tsx.
export function GestorAgenciasView({
  perfil,
  executivos,
  agregadoPromise,
}: GestorAgenciasViewProps) {
  return (
    <GestorDetalheShell perfil={perfil} abaAtiva="agencias">
      <Suspense fallback={<SecaoSkeleton altura="h-96" />}>
        <GestorAgenciasSecao executivos={executivos} agregadoPromise={agregadoPromise} />
      </Suspense>
    </GestorDetalheShell>
  );
}

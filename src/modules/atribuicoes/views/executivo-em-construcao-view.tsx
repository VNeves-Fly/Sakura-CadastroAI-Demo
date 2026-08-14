import { Construction } from "lucide-react";
import { ExecutivoProfileHeader } from "@/modules/atribuicoes/components/executivo/executivo-profile-header";
import { ExecutivoTabsNav } from "@/modules/atribuicoes/components/executivo/executivo-tabs-nav";
import type { ExecutivoPerfil } from "@/modules/atribuicoes/types/executivo-detalhe.types";

interface ExecutivoEmConstrucaoViewProps {
  perfil: ExecutivoPerfil;
  aba: "agenda" | "agencias";
  titulo: string;
  descricao: string;
}

// Placeholder das abas Agenda/Agências (fases 3 e 4 do SPEC) — mantém o
// header e a navegação reais funcionando desde já, só o conteúdo da aba
// ainda não foi construído.
export function ExecutivoEmConstrucaoView({
  perfil,
  aba,
  titulo,
  descricao,
}: ExecutivoEmConstrucaoViewProps) {
  return (
    <div className="flex w-full flex-col gap-5">
      <h1 className="text-foreground text-xl font-semibold">Detalhes do Executivo</h1>
      <ExecutivoProfileHeader perfil={perfil} />
      <ExecutivoTabsNav executivoId={perfil.id} abaAtiva={aba} />

      <div className="border-border bg-card flex flex-col items-center gap-3 rounded-2xl border p-16 text-center">
        <Construction className="text-muted-foreground size-8" />
        <h2 className="text-foreground text-base font-semibold">{titulo}</h2>
        <p className="text-muted-foreground max-w-md text-sm">{descricao}</p>
      </div>
    </div>
  );
}

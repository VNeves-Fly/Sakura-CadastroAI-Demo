import Link from "next/link";
import { Mail, MapPin, Pencil, Trophy, Heart, Circle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SensitiveValue } from "@/modules/shared/components/sensitive-value";
import { ToggleVisibilidadeButton } from "@/modules/shared/components/toggle-visibilidade-button";
import {
  gerarGradienteAvatar,
  extrairIniciais,
} from "@/modules/shared/utils/avatar-gradiente.util";
import type { ExecutivoPerfil } from "@/modules/atribuicoes/types/executivo-detalhe.types";

interface ExecutivoProfileHeaderProps {
  perfil: ExecutivoPerfil;
}

// Cartão de identidade do executivo (SPEC seção 3.2) — avatar com
// gradiente único por id, badges de bases/conquistas e os 3 KPIs de topo
// (agências / gestor responsável / vendendo últimos 30d).
export function ExecutivoProfileHeader({ perfil }: ExecutivoProfileHeaderProps) {
  const conquistas = perfil.conquistas;

  return (
    <div className="border-border bg-card rounded-2xl border p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <span
            className="flex size-16 shrink-0 items-center justify-center rounded-full text-lg font-bold text-white"
            style={{ background: gerarGradienteAvatar(perfil.id) }}
          >
            {extrairIniciais(perfil.nome)}
          </span>

          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-foreground text-xl font-bold uppercase">{perfil.nome}</h1>
              {perfil.sica ? (
                <Badge variant="outline" className="font-mono">
                  SICA {perfil.sica}
                </Badge>
              ) : null}
            </div>

            <div className="text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
              <Mail className="size-3.5" />
              <span>{perfil.email}</span>
              {perfil.bases.length > 0 ? (
                <>
                  <span aria-hidden>·</span>
                  <MapPin className="size-3.5" />
                  <span>Base {perfil.bases[0]}</span>
                </>
              ) : null}
            </div>

            {perfil.bases.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {perfil.bases.map((base) => (
                  <Badge key={base} variant="outline">
                    {base}
                  </Badge>
                ))}
              </div>
            ) : null}

            <div className="flex flex-wrap gap-1.5">
              <Badge variant="outline" className="gap-1">
                <Heart className="size-3" /> {conquistas.agencias10k} Agências 10K
              </Badge>
              <Badge variant="outline" className="gap-1">
                <Heart className="size-3" /> {conquistas.agencias100k} Agências 100K
              </Badge>
              <Badge variant="outline" className="gap-1">
                <Heart className="size-3" /> {conquistas.agencias1m} Agências 1M
              </Badge>
              <Badge className="gap-1">
                <Trophy className="size-3" /> {conquistas.agencias10m} Agências 10M
              </Badge>
              <Badge variant="secondary" className="gap-1">
                <Circle className="size-3" /> {conquistas.agenciasSemVenda} Agências s/venda
              </Badge>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ToggleVisibilidadeButton />
          <Link
            href={`/crm/executivos/${perfil.id}/editar`}
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-xs font-medium"
          >
            <Pencil className="size-3.5" />
            Editar cadastro
          </Link>
        </div>
      </div>

      <div className="border-border mt-6 grid grid-cols-1 gap-4 border-t pt-5 sm:grid-cols-3">
        <div>
          <p className="text-foreground text-2xl font-bold">
            <SensitiveValue value={perfil.totalAgencias} />
          </p>
          <p className="text-muted-foreground text-[11px] font-semibold tracking-wide uppercase">
            Agências
          </p>
        </div>
        <div>
          <p className="text-foreground text-lg font-semibold">{perfil.gestorNome ?? "—"}</p>
          <p className="text-muted-foreground text-[11px] font-semibold tracking-wide uppercase">
            Gestor responsável
          </p>
        </div>
        <div>
          <p className="text-success text-2xl font-bold">
            <SensitiveValue value={perfil.vendendoUltimos30d} />
          </p>
          <p className="text-muted-foreground text-[11px] font-semibold tracking-wide uppercase">
            Venderam últimos 30d · <SensitiveValue value={`${perfil.vendendoUltimos30dPct}%`} />
          </p>
        </div>
      </div>
    </div>
  );
}

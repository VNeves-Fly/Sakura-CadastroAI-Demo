import { ListOrdered } from "lucide-react";
import type { SignatarioFila } from "@/modules/admin/types/dossie.types";
import { SecaoColapsavel } from "@/modules/admin/components/secao-colapsavel";
import { formatarData } from "@/modules/admin/utils/dossie-campos.util";

// D4Sign avisou (webhook type_post=2) que o convite pra assinar nunca
// chegou nesse e-mail — sem isso, o signatário fica esperando pra sempre
// um convite que não existe.
function BadgeEmailNaoEntregue() {
  return (
    <span
      className="bg-destructive/15 text-destructive rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase"
      title="O e-mail de convite pra assinatura não foi entregue — confirme o endereço com o signatário."
    >
      E-mail não entregue
    </span>
  );
}

function BadgeGrupo({ grupo }: { grupo: SignatarioFila["grupo"] }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase ${
        grupo === "Agência" ? "bg-info/15 text-info" : "bg-primary/15 text-primary"
      }`}
    >
      {grupo}
    </span>
  );
}

// `assinadoEm` presente = registro real do webhook do D4Sign; assinado
// sem data = fallback inferido do status agregado do contrato (ver
// montarFilaAssinatura no dossie.adapter.ts).
function BadgeStatusSignatario({
  assinado,
  assinadoEm,
}: {
  assinado: boolean;
  assinadoEm: Date | null;
}) {
  return (
    <div className="flex shrink-0 flex-col items-end gap-0.5">
      <span
        className={`rounded-full px-2.5 py-0.5 text-xs font-bold uppercase ${
          assinado ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"
        }`}
      >
        {assinado ? "Assinado" : "Aguardando"}
      </span>
      {assinadoEm ? (
        <span className="text-muted-foreground text-[10px]">{formatarData(assinadoEm)}</span>
      ) : null}
    </div>
  );
}

// Fila numerada de quem precisa assinar o contrato (sócios da agência +
// signatários fixos da Sakura) — ver montarFilaAssinatura no
// dossie.adapter.ts pra origem de cada campo.
export function FilaAssinatura({ fila }: { fila: SignatarioFila[] }) {
  const totalAssinados = fila.filter((item) => item.assinado).length;

  return (
    <SecaoColapsavel titulo="Fila de Assinatura" icon={<ListOrdered className="size-4" />}>
      <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
        <span className="text-muted-foreground">
          <strong className="text-foreground">Signatários:</strong> {fila.length}
        </span>
        <span className="text-muted-foreground">
          <strong className="text-foreground">Assinados:</strong> {totalAssinados}/{fila.length}
        </span>
      </div>

      <ol className="flex flex-col gap-2">
        {fila.map((item, index) => (
          <li
            key={item.id}
            className="border-border bg-muted/30 flex flex-wrap items-center gap-2 rounded-xl border p-3"
          >
            <span className="bg-background text-muted-foreground flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold">
              {index + 1}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-foreground text-sm font-medium">{item.nome}</span>
                <BadgeGrupo grupo={item.grupo} />
                {item.emailNaoEntregue ? <BadgeEmailNaoEntregue /> : null}
              </div>
              {item.email ? (
                <span className="text-muted-foreground text-xs break-all">{item.email}</span>
              ) : null}
            </div>
            <BadgeStatusSignatario assinado={item.assinado} assinadoEm={item.assinadoEm} />
          </li>
        ))}
      </ol>
    </SecaoColapsavel>
  );
}

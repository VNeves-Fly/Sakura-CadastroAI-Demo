import { ListOrdered } from "lucide-react";
import type { SignatarioFila } from "@/modules/admin/types/dossie.types";
import { SecaoColapsavel } from "./secao-colapsavel";

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

function BadgeStatusSignatario({ assinado }: { assinado: boolean }) {
  return (
    <span
      className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold uppercase ${
        assinado ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"
      }`}
    >
      {assinado ? "Assinado" : "Aguardando"}
    </span>
  );
}

// Fila numerada de quem precisa assinar o contrato (sócios da agência +
// signatários fixos da Sakura) — ver montarFilaAssinatura no
// dossie.adapter.ts pra origem de cada campo. Não existe timestamp nem
// ordem real de assinatura por pessoa no schema hoje, só o status
// agregado do Contrato: o "Assinado"/"Aguardando" por linha é uma
// inferência sobre esse status, não um dado individual gravado.
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
            <BadgeStatusSignatario assinado={item.assinado} />
          </li>
        ))}
      </ol>

      <div className="border-border bg-muted/40 text-muted-foreground mt-3 rounded-xl border border-dashed px-4 py-3 text-xs">
        <strong className="text-foreground">Status por pessoa é inferido, não gravado:</strong> o
        schema hoje só guarda o status agregado do contrato (D4Sign não expõe timestamp nem ordem de
        assinatura por signatário pra esse fluxo) — quando esses campos existirem, cada linha passa
        a mostrar o dado real.
      </div>
    </SecaoColapsavel>
  );
}

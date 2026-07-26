import Link from "next/link";
import { SignatarioPadraoForm } from "../signatario-padrao-form";
import { criarSignatarioPadraoAction } from "../actions";

export default function NovoSignatarioPadraoPage() {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <Link
          href="/painel/signatarios-padrao"
          className="text-muted-foreground hover:text-foreground text-xs"
        >
          ← Voltar
        </Link>
        <h1 className="text-foreground text-lg font-bold">Novo signatário padrão</h1>
      </div>

      <div className="border-border bg-card rounded-2xl border p-5">
        <SignatarioPadraoForm action={criarSignatarioPadraoAction} />
      </div>
    </div>
  );
}

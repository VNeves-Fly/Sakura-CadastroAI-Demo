import type { ReactNode } from "react";
import type { SignatarioPadrao } from "@/modules/cadastro/domain/entities/signatario-padrao.entity";
import { PAPEL_SIGNATARIO_PADRAO_OPCOES } from "@/modules/admin/utils/papel-signatario-padrao.util";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

const INPUT_CLASSES =
  "border-input bg-background text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-ring/30 w-full rounded-full border px-4 py-2 text-sm outline-none focus:ring-2";

// items do Select — sem isso, `<Select.Value>` mostra o valor bruto do
// enum (ex: "ASSINAR_COMO_PARTE_E_FIADOR") em vez do rótulo em português.
const PAPEL_SIGNATARIO_PADRAO_ITEMS: Record<string, string> = Object.fromEntries(
  PAPEL_SIGNATARIO_PADRAO_OPCOES.map((opcao) => [opcao.valor, opcao.label]),
);

function Campo({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-primary/70 text-[11px] font-bold tracking-wide uppercase">{label}</span>
      {children}
    </label>
  );
}

export function SignatarioPadraoForm({
  signatario,
  action,
}: {
  signatario?: SignatarioPadrao | null;
  action: (formData: FormData) => Promise<void>;
}) {
  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Campo label="Nome">
          <input
            name="nome"
            defaultValue={signatario?.nome ?? ""}
            required
            className={INPUT_CLASSES}
          />
        </Campo>
        <Campo label="Cargo">
          <input name="cargo" defaultValue={signatario?.cargo ?? ""} className={INPUT_CLASSES} />
        </Campo>
        <Campo label="E-mail">
          <input
            type="email"
            name="email"
            defaultValue={signatario?.email ?? ""}
            required
            className={INPUT_CLASSES}
          />
        </Campo>
        <Campo label="Telefone">
          <input
            name="telefone"
            defaultValue={signatario?.telefone ?? ""}
            className={INPUT_CLASSES}
          />
        </Campo>
        <Campo label="Papel (ato no D4Sign)">
          <Select
            items={PAPEL_SIGNATARIO_PADRAO_ITEMS}
            name="papel"
            defaultValue={signatario?.papel ?? undefined}
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              {PAPEL_SIGNATARIO_PADRAO_OPCOES.map((opcao) => (
                <SelectItem key={opcao.valor} value={opcao.valor}>
                  {opcao.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Campo>
        <Campo label="Estágio (fila de assinatura — sócios = 0)">
          <input
            type="number"
            name="estagio"
            min={1}
            defaultValue={signatario?.estagio ?? 1}
            required
            className={INPUT_CLASSES}
          />
        </Campo>
        <Campo label="Ordem de exibição (opcional)">
          <input
            type="number"
            name="ordem"
            defaultValue={signatario?.ordem ?? ""}
            className={INPUT_CLASSES}
          />
        </Campo>
      </div>

      <div>
        <button
          type="submit"
          className="bg-primary text-primary-foreground hover:bg-sakura-600 rounded-full px-4 py-2 text-sm font-semibold transition"
        >
          Salvar
        </button>
      </div>
    </form>
  );
}

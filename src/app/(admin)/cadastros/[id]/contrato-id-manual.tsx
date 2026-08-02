"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { registrarContratoExternoAction } from "./actions";

const INPUT_CLASSNAME =
  "min-w-0 flex-1 rounded-full border border-input bg-background px-3 py-1.5 text-xs font-mono text-foreground outline-none placeholder:font-sans placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60";

interface ContratoIdManualProps {
  agenciaId: string;
  contratoId: string;
  provedorId: string;
  // Vem de contratoAtual.origemGeracao === "externo" (persiste ao
  // recarregar) — ver RegistrarContratoExternoUseCase.
  origemExterno: boolean;
  // true quando o analista está revendo esta etapa a partir de uma etapa
  // posterior (ver `etapaExibida` na page) — esconde o link de registrar/
  // editar, só sobra a leitura do ID (e da tag, se já tiver uma).
  somenteLeitura?: boolean;
}

// ID do contrato gerado pelo D4Sign (Contrato.provedorId) — mas alguns
// contratos são assinados por fora da plataforma (fisicamente ou por
// outro meio), sem nunca passar pelo fluxo automático. "Salvar" chama
// registrarContratoExternoAction, que confirma o documento no D4Sign,
// confere os destinatários, registra nosso webhook nele e persiste — só
// depois disso o ID exibido muda de verdade (revalidatePath do server).
export function ContratoIdManual({
  agenciaId,
  contratoId,
  provedorId,
  origemExterno,
  somenteLeitura = false,
}: ContratoIdManualProps) {
  const [editando, setEditando] = useState(false);
  const [rascunho, setRascunho] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [avisos, setAvisos] = useState<string[]>([]);

  async function handleSalvar() {
    const idColado = rascunho.trim();
    if (idColado.length === 0) return;

    setSalvando(true);
    setErro(null);
    const resultado = await registrarContratoExternoAction(agenciaId, contratoId, idColado);
    setSalvando(false);

    if (!resultado.ok) {
      setErro(resultado.motivo);
      return;
    }

    setAvisos(resultado.avisos);
    setEditando(false);
    setRascunho("");
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="bg-primary/10 text-primary rounded-md px-2 py-0.5 font-mono text-xs font-semibold break-all">
          {provedorId}
        </span>
        {origemExterno ? (
          <span className="bg-destructive/15 text-destructive rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase">
            Contrato não assinado na plataforma
          </span>
        ) : null}
      </div>

      {avisos.length > 0 ? (
        <div className="bg-warning/10 text-warning flex flex-col gap-1 rounded-lg px-3 py-2 text-xs">
          {avisos.map((aviso) => (
            <p key={aviso}>{aviso}</p>
          ))}
        </div>
      ) : null}

      {somenteLeitura ? null : editando ? (
        <div className="flex flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <input
              value={rascunho}
              onChange={(event) => setRascunho(event.target.value)}
              placeholder="Cole aqui o ID (uuid) do contrato assinado por fora"
              disabled={salvando}
              className={INPUT_CLASSNAME}
            />
            <button
              type="button"
              disabled={rascunho.trim().length === 0 || salvando}
              aria-busy={salvando}
              onClick={handleSalvar}
              className="bg-primary text-primary-foreground hover:bg-sakura-600 flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50"
            >
              {salvando ? <Loader2 className="size-3.5 animate-spin" /> : null}
              {salvando ? "Verificando..." : "Salvar"}
            </button>
            <button
              type="button"
              disabled={salvando}
              onClick={() => {
                setEditando(false);
                setRascunho("");
                setErro(null);
              }}
              className="border-input text-foreground hover:bg-accent shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancelar
            </button>
          </div>
          {erro ? <p className="text-destructive text-xs font-medium">{erro}</p> : null}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => {
            setRascunho("");
            setErro(null);
            setEditando(true);
          }}
          className="text-primary self-start text-xs font-semibold hover:underline"
        >
          {origemExterno
            ? "Editar ID do contrato assinado por fora"
            : "Contrato assinado por fora da plataforma?"}
        </button>
      )}
    </div>
  );
}

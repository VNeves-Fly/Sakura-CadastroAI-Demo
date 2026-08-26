"use client";

import { useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { X, Loader2 } from "lucide-react";
import { Campo, CamposGrid, CampoEndereco } from "@/modules/admin/components/dossie-campos";
import { labelEstadoCivil } from "@/modules/admin/adapters/dossie.adapter";
import type {
  EnderecoData,
  RepresentanteLegalDetalhe,
} from "@/modules/cadastro/domain/repositories/agencia-repository";

interface AprovarComplementarModalProps {
  razaoSocial: string;
  cnpj: string;
  enderecoAgencia: EnderecoData;
  representantesLegais: RepresentanteLegalDetalhe[];
  aprovarComplementarAction: (formData: FormData) => Promise<void>;
  disabled?: boolean;
}

// Precisa viver DENTRO do <form> — useFormStatus só enxerga o form
// ancestral mais próximo. É a fonte confiável de "está enviando": um
// useState setado direto dentro do callback de `action` fica sujeito ao
// batching da transição do React e podia nunca repintar antes da página
// mudar de etapa via revalidatePath (bug relatado pelo usuário,
// 2026-08-26 — o botão "ficava igual" e só a página mudava depois,
// sem nenhum feedback visual no meio). `onPendingChange` espelha esse
// valor pro modal (fora do form) poder travar o backdrop/botão-X também.
function RodapeAprovacao({
  gerarContrato,
  onGerarContratoChange,
  onVoltar,
  onPendingChange,
}: {
  gerarContrato: boolean;
  onGerarContratoChange: (checked: boolean) => void;
  onVoltar: () => void;
  onPendingChange: (pending: boolean) => void;
}) {
  const { pending } = useFormStatus();

  useEffect(() => {
    onPendingChange(pending);
  }, [pending, onPendingChange]);

  return (
    <>
      <label className="flex items-start gap-2 text-sm">
        <input
          type="checkbox"
          name="gerarContrato"
          checked={gerarContrato}
          onChange={(event) => onGerarContratoChange(event.target.checked)}
          disabled={pending}
          className="mt-0.5 size-4 shrink-0"
        />
        <span className="text-foreground">
          Gerar contrato automaticamente
          <span className="text-muted-foreground block text-xs">
            Desmarcado, o cadastro avança sem gerar contrato — anexe um documento existente depois
            em &ldquo;Contrato assinado por fora da plataforma&rdquo;.
          </span>
        </span>
      </label>

      {pending ? (
        <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
          <Loader2 className="size-3.5 animate-spin" />
          {gerarContrato
            ? "Gerando e enviando o contrato no D4Sign — pode levar alguns segundos, não feche esta janela."
            : "Avançando o cadastro — não feche esta janela."}
        </p>
      ) : null}

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onVoltar}
          disabled={pending}
          className="border-input text-foreground hover:bg-accent rounded-full border px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50"
        >
          Voltar e revisar
        </button>
        <button
          type="submit"
          disabled={pending}
          aria-busy={pending}
          className="bg-primary text-primary-foreground hover:bg-sakura-600 flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-70"
        >
          {pending ? <Loader2 className="size-4 animate-spin" /> : null}
          {pending
            ? "Enviando..."
            : gerarContrato
              ? "Confirmar e Enviar Contrato"
              : "Confirmar sem gerar contrato"}
        </button>
      </div>
    </>
  );
}

// Antes o clique em "Aprovar e Enviar Contrato" disparava a geração do
// contrato direto (form submit sem confirmação) — o analista não tinha
// chance de revisar os dados que efetivamente vão pro documento (razão
// social/CNPJ/endereço da empresa + quais sócios assinam) antes de gerar
// algo que já sai pro D4Sign. Este modal intercala uma revisão explícita;
// a ação em si (aprovarComplementarAction) continua a mesma, só passa a
// ser disparada no "Confirmar" do modal em vez do clique original.
export function AprovarComplementarModal({
  razaoSocial,
  cnpj,
  enderecoAgencia,
  representantesLegais,
  aprovarComplementarAction,
  disabled = false,
}: AprovarComplementarModalProps) {
  const [aberto, setAberto] = useState(false);
  // Espelha o `pending` de useFormStatus (ver RodapeAprovacao, via
  // onPendingChange) — só pra travar o backdrop/botão-X, que ficam FORA
  // do <form> e não têm como chamar o hook diretamente.
  const [enviando, setEnviando] = useState(false);
  const [gerarContrato, setGerarContrato] = useState(true);

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        disabled={disabled}
        className="bg-primary text-primary-foreground hover:bg-sakura-600 disabled:hover:bg-primary rounded-full px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50"
      >
        Aprovar e Enviar Contrato
      </button>

      {aberto ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4 py-6 backdrop-blur-md"
          onClick={() => !enviando && setAberto(false)}
        >
          <div
            className="border-border bg-card flex max-h-[85vh] w-full max-w-2xl flex-col rounded-3xl border shadow-2xl shadow-black/40"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="border-border flex items-center justify-between gap-2 border-b px-6 py-4">
              <h2 className="text-foreground text-base font-semibold">
                Confirmar geração do contrato
              </h2>
              <button
                type="button"
                onClick={() => setAberto(false)}
                disabled={enviando}
                aria-label="Fechar"
                className="text-muted-foreground hover:bg-accent hover:text-foreground shrink-0 rounded-full p-1 transition disabled:cursor-not-allowed disabled:opacity-40"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="flex flex-col gap-4 overflow-y-auto px-6 py-4">
              <p className="text-muted-foreground text-sm">
                {gerarContrato
                  ? "Confira os dados abaixo antes de gerar e enviar o contrato para assinatura no D4Sign — essa ação não pode ser desfeita."
                  : 'Confira os dados abaixo. O cadastro avança pra Assinatura sem gerar um contrato novo no D4Sign — use quando for anexar um documento já existente depois, em "Contrato assinado por fora da plataforma".'}
              </p>

              <div className="flex flex-col gap-2">
                <span className="text-[11px] font-bold tracking-wide text-neutral-500 uppercase">
                  Empresa
                </span>
                <CamposGrid>
                  <Campo label="Razão Social">{razaoSocial}</Campo>
                  <Campo label="CNPJ">{cnpj}</Campo>
                  <CampoEndereco label="Endereço da Agência" endereco={enderecoAgencia} />
                </CamposGrid>
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-[11px] font-bold tracking-wide text-neutral-500 uppercase">
                  Sócios
                </span>
                <div className="flex flex-col gap-3">
                  {representantesLegais.map((socio) => (
                    <div
                      key={socio.id}
                      className="border-border bg-muted/40 flex flex-col gap-2 rounded-xl border px-4 py-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-1.5">
                        <span className="text-foreground font-semibold">{socio.nome}</span>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            socio.administrativo === false
                              ? "bg-muted text-muted-foreground"
                              : "bg-success/15 text-success"
                          }`}
                        >
                          {socio.administrativo === false
                            ? "Não assina o contrato"
                            : "Assina o contrato"}
                        </span>
                      </div>
                      <CamposGrid>
                        <Campo label="CPF">{socio.cpf}</Campo>
                        <Campo label="E-mail">{socio.email}</Campo>
                        <Campo label="Telefone">{socio.telefone}</Campo>
                        <Campo label="Estado Civil">{labelEstadoCivil(socio.estadoCivil)}</Campo>
                        <CampoEndereco label="Endereço" endereco={socio.endereco} />
                      </CamposGrid>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <form
              action={async (formData) => {
                await aprovarComplementarAction(formData);
                setAberto(false);
              }}
              className="border-border flex flex-col gap-3 border-t px-6 py-4"
            >
              <RodapeAprovacao
                gerarContrato={gerarContrato}
                onGerarContratoChange={setGerarContrato}
                onVoltar={() => setAberto(false)}
                onPendingChange={setEnviando}
              />
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}

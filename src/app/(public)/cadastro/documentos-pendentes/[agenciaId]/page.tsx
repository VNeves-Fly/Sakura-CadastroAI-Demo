import Image from "next/image";
import { notFound } from "next/navigation";
import { cadastroPublicoController } from "@/modules/cadastro/presentation/controllers/cadastro-publico.controller";
import { reenviarDocumentoAction } from "./actions";

const LABEL_TIPO: Record<string, string> = {
  CONTRATO_SOCIAL: "Contrato Social",
  RG_CNPJ: "RG/CNH",
  PROCURACAO: "Procuração",
};

// Página pública (sem login — o próprio id da agência funciona como
// "token" de acesso, decisão explícita do usuário: só permite enviar um
// arquivo de reposição, não expõe dado sensível nenhum). Mostra só os
// documentos reprovados — o resto do cadastro nunca chega aqui, ver
// ListarDocumentosPendentesUseCase.
export default async function DocumentosPendentesPage({
  params,
}: {
  params: { agenciaId: string };
}) {
  const detalhe = await cadastroPublicoController
    .listarDocumentosPendentes(params.agenciaId)
    .catch(() => null);

  if (!detalhe) {
    notFound();
  }

  const { razaoSocial, documentosPendentes } = detalhe;

  return (
    <div className="bg-background flex min-h-screen flex-col items-center gap-6 px-4 py-10">
      <div className="border-border bg-card shadow-sakura-900/5 w-full max-w-xl rounded-[2rem] border p-6 shadow-xl sm:p-10">
        <div className="mb-6 flex items-center justify-center">
          <Image
            src="/logos/logo-sakura-oficial.png"
            alt="Sakura Consolidadora"
            width={140}
            height={48}
            className="h-10 w-auto object-contain"
            priority
          />
        </div>

        <h1 className="text-foreground text-center text-lg font-semibold">{razaoSocial}</h1>

        {documentosPendentes.length === 0 ? (
          <div className="mt-6 text-center">
            <p className="text-success text-sm font-medium">
              ✓ Nenhum documento pendente de reenvio.
            </p>
            <p className="text-muted-foreground mt-1 text-sm">
              Se você recebeu um e-mail pedindo um documento, ele já foi reenviado com sucesso.
            </p>
          </div>
        ) : (
          <div className="mt-6 flex flex-col gap-4">
            <p className="text-muted-foreground text-center text-sm">
              Um analista revisou seu cadastro e pediu o reenvio dos documentos abaixo. Envie um
              arquivo novo pra cada um.
            </p>

            {documentosPendentes.map((documento) => (
              <form
                key={documento.id}
                action={reenviarDocumentoAction.bind(null, params.agenciaId, documento.id)}
                className="border-border bg-muted/30 flex flex-col gap-2 rounded-2xl border p-4"
              >
                <span className="text-foreground text-sm font-semibold">
                  {LABEL_TIPO[documento.tipo] ?? documento.tipo}
                  {documento.nomeSocio ? ` — ${documento.nomeSocio}` : ""}
                </span>
                {documento.motivoReprovacao ? (
                  <p className="text-warning text-xs">{documento.motivoReprovacao}</p>
                ) : null}
                <input
                  type="file"
                  name="arquivo"
                  accept=".pdf,.jpg,.jpeg,.png"
                  required
                  className="text-foreground file:bg-primary file:text-primary-foreground text-sm file:mr-3 file:rounded-full file:border-0 file:px-4 file:py-2 file:text-sm file:font-medium"
                />
                <button
                  type="submit"
                  className="bg-primary text-primary-foreground hover:bg-sakura-600 w-fit rounded-full px-4 py-2 text-sm font-semibold transition"
                >
                  Enviar documento
                </button>
              </form>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

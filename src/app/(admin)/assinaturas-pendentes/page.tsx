import Link from "next/link";
import { getServerSession } from "next-auth";
import { nextAuthOptions } from "@/modules/auth/presentation/routes/next-auth.options";
import { cadastroAdminController } from "@/modules/cadastro/presentation/controllers/cadastro-admin.controller";
import { LinkAssinaturaButton } from "@/app/(admin)/cadastros/[id]/link-assinatura-button";
import { obterLinkAssinaturaAction } from "@/app/(admin)/cadastros/[id]/actions";

// Tela pros signatários fixos da Sakura (gestores) verem os contratos
// pendentes da assinatura DELES especificamente — sem gate de Legitimuz,
// só os sócios passam por biometria (ver docs/legitimuz/). Motivada pelo
// fluxo paralelo: com skip_email:"1", o D4Sign não notifica mais ninguém
// sozinho, então essa tela vira a forma deles acompanharem o que falta
// assinar (reaproveita ObterLinkAssinaturaUseCase, mesmo botão da Fila de
// Assinatura do dossiê).
export default async function AssinaturasPendentesPage() {
  const session = await getServerSession(nextAuthOptions);
  const email = session?.user?.email;

  const contratos = email
    ? await cadastroAdminController.listarContratosPendentesGestor(email)
    : [];

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 p-6">
      <h1 className="text-foreground text-xl font-semibold">Contratos pendentes de assinatura</h1>
      <p className="text-muted-foreground text-sm">
        Contratos onde <span className="font-medium">{email}</span> ainda precisa assinar.
      </p>

      {contratos.length === 0 ? (
        <p className="text-muted-foreground border-border rounded-2xl border border-dashed p-6 text-center text-sm">
          Nenhum contrato pendente da sua assinatura no momento.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {contratos.map((contrato) => (
            <li
              key={contrato.contratoId}
              className="border-border bg-card flex flex-col gap-2 rounded-2xl border p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <Link
                  href={`/cadastros/${contrato.agenciaId}`}
                  className="text-foreground text-sm font-semibold hover:underline"
                >
                  {contrato.razaoSocial}
                </Link>
              </div>
              <LinkAssinaturaButton
                agenciaId={contrato.agenciaId}
                email={email ?? ""}
                obterLinkAssinaturaAction={obterLinkAssinaturaAction}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

import { getServerSession } from "next-auth";
import { nextAuthOptions } from "@/modules/auth/presentation/routes/next-auth.options";
import { AtendimentoView } from "@/modules/atendimento/components/atendimento-view";

export default async function AtendimentoPage({
  searchParams,
}: {
  searchParams: { telefone?: string };
}) {
  const session = await getServerSession(nextAuthOptions);
  const analistaAtual = session?.user?.name ?? session?.user?.email ?? "Analista";

  return (
    // Altura travada no viewport (menos o header do Admin, 59px, e o
    // padding vertical do <main> do layout, 24px+24px) — diferente das
    // outras páginas do Admin, um chat precisa caber inteiro na tela sem
    // rolar a página (só as colunas internas rolam), senão o campo de
    // digitação fica escondido embaixo, exigindo scroll pra achar — bug
    // relatado pelo usuário em 2026-07-23.
    <div className="flex h-[calc(100dvh-107px)] flex-col gap-3">
      <div className="shrink-0">
        <h1 className="text-foreground text-lg font-bold">Atendimento</h1>
        <p className="text-muted-foreground text-sm">
          Converse com os sócios e contatos das agências pelo WhatsApp.
        </p>
      </div>

      <AtendimentoView analistaAtual={analistaAtual} telefoneInicial={searchParams.telefone} />
    </div>
  );
}

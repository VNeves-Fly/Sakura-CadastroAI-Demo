import { getServerSession } from "next-auth";
import { nextAuthOptions } from "@/modules/auth/presentation/routes/next-auth.options";
import { AtendimentoView } from "@/modules/atendimento/components/atendimento-view";

export default async function AtendimentoPage() {
  const session = await getServerSession(nextAuthOptions);
  const analistaAtual = session?.user?.name ?? session?.user?.email ?? "Analista";

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl bg-[#fdf1f7] p-6 shadow-sm">
        <h1 className="text-xl font-bold text-[#72243e]">Atendimento</h1>
        <p className="mt-1 text-sm text-[#72243e]/75">
          Converse com os sócios e contatos das agências pelo WhatsApp.
        </p>
      </div>

      <AtendimentoView analistaAtual={analistaAtual} />
    </div>
  );
}

import { getServerSession } from "next-auth";
import { nextAuthOptions } from "@/modules/auth/presentation/routes/next-auth.options";
import { MessengerConfigView } from "@/modules/atendimento/components/messenger-config-view";

export default async function MessengerConfigPage() {
  const session = await getServerSession(nextAuthOptions);
  const analistaAtual = session?.user?.name ?? session?.user?.email ?? "Analista";

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl bg-[#fdf1f7] p-6 shadow-sm">
        <h1 className="text-xl font-bold text-[#72243e]">Messenger</h1>
        <p className="mt-1 text-sm text-[#72243e]/75">
          Configurações da integração com o WhatsApp Business (Meta) usada no Atendimento.
        </p>
      </div>

      <MessengerConfigView analistaAtual={analistaAtual} />
    </div>
  );
}

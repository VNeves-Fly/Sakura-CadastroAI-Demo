import Link from "next/link";
import { MessageCircle } from "lucide-react";

const BOTAO_CLASSES =
  "border-input text-foreground hover:bg-accent flex w-fit items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition";

// Atalho pro /atendimento daquela agência — a escolha de número
// (Comercial/sócios, quando há mais de um) e o assumir-atendimento (trava
// de 2h) agora acontecem lá, via ?agenciaId= (ver ModalEscolhaContato em
// use-atendimento.view-model.ts), não mais aqui no dossiê.
export function AtendimentoButton({ agenciaId }: { agenciaId: string }) {
  return (
    <Link href={`/atendimento?agenciaId=${agenciaId}`} className={BOTAO_CLASSES}>
      <MessageCircle className="size-4" />
      Atendimento
    </Link>
  );
}

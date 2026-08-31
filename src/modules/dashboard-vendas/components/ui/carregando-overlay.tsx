import { Loader2 } from "lucide-react";

// Cobre um card já montado (mesmo espírito do overlay de
// visualizar-documento.tsx) enquanto o filtro "Personalizado" busca o
// intervalo real no SST — o card continua mostrando o valor anterior
// (prévia de "Este mês" ou o período de antes) por baixo, mas some assim
// que os dados novos chegam (ver personalizado.carregando na store). O
// pai precisa ser `relative` pro `inset-0` funcionar.
export function CarregandoOverlay({ ativo }: { ativo: boolean }) {
  if (!ativo) return null;
  return (
    <div className="bg-card/80 absolute inset-0 z-10 flex items-center justify-center rounded-2xl">
      <Loader2 className="text-primary size-6 animate-spin" />
    </div>
  );
}

// Dossiê da agência (5 etapas — ver CAMPOS-ADMIN.md Parte B) ainda não
// implementado. Este placeholder só existe pra dar destino real ao
// clique na linha da listagem.
export default function DossieAgenciaPage({ params }: { params: { id: string } }) {
  return (
    <div className="border-border bg-card rounded-2xl border p-6">
      <h1 className="text-foreground text-lg font-semibold">Dossiê da agência</h1>
      <p className="text-muted-foreground mt-2 text-sm">
        Agência {params.id} — dossiê de 5 etapas em construção.
      </p>
    </div>
  );
}

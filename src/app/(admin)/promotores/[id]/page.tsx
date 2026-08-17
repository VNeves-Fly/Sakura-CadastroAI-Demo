import { redirect } from "next/navigation";

// Rota renomeada para /crm/executivos/:id — mantido só como redirect pra não
// quebrar links/favoritos antigos apontando pra /promotores/:id.
export default function PromotorEditPageRedirect({ params }: { params: { id: string } }) {
  redirect(`/crm/executivos/${params.id}`);
}

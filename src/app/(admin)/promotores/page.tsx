import { redirect } from "next/navigation";

// Rota renomeada para /executivos — mantido só como redirect pra não quebrar
// links/favoritos antigos apontando pra /promotores.
export default function PromotoresPageRedirect() {
  redirect("/executivos");
}

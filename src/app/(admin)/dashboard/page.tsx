import { redirect } from "next/navigation";

// Rota movida pra /cadastros/dashboard em 2026-09-01 (fica junto da área de
// cadastros no menu) — mantido como redirect pra não quebrar
// bookmarks/links externos pro caminho antigo.
export default function DashboardRedirectPage() {
  redirect("/cadastros/dashboard");
}

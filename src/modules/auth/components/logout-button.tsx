"use client";

import { useLogoutViewModel } from "@/modules/auth/view-models/use-logout.view-model";

export function LogoutButton() {
  const { isLoggingOut, logout } = useLogoutViewModel();

  return (
    <button
      type="button"
      onClick={logout}
      disabled={isLoggingOut}
      className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:opacity-60"
    >
      {isLoggingOut ? "Saindo..." : "Sair"}
    </button>
  );
}

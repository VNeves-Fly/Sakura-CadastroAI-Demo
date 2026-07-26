"use client";

import { useLogoutViewModel } from "@/modules/auth/view-models/use-logout.view-model";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface UserMenuProps {
  userName: string | null;
  userEmail: string | null;
}

function iniciaisDoUsuario(userName: string | null, userEmail: string | null): string {
  if (userName) {
    const partes = userName.trim().split(/\s+/);
    const primeira = partes[0]?.[0] ?? "";
    const ultima = partes.length > 1 ? (partes[partes.length - 1]?.[0] ?? "") : "";
    return (primeira + ultima).toUpperCase();
  }
  return userEmail?.[0]?.toUpperCase() ?? "?";
}

export function UserMenu({ userName, userEmail }: UserMenuProps) {
  const { isLoggingOut, logout } = useLogoutViewModel();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="hover:bg-accent flex items-center gap-2 rounded-md p-1 px-4 outline-none">
        <div className="flex flex-col items-end leading-tight">
          <span className="text-foreground text-sm font-medium">{userName ?? "Usuário"}</span>
          {userEmail ? <span className="text-muted-foreground text-xs">{userEmail}</span> : null}
        </div>
        <Avatar>
          <AvatarFallback>{iniciaisDoUsuario(userName, userEmail)}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem>Perfil</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={logout} disabled={isLoggingOut}>
          {isLoggingOut ? "Saindo..." : "Sair"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

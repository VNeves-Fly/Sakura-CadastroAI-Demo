import { KeyRound } from "lucide-react";
import { CARGO_LABELS } from "@/modules/users/utils/cargo-options";
import type { UserView } from "@/modules/users/types/user.types";
import type { ResetUserPasswordStatus } from "@/modules/users/view-models/use-reset-user-password.view-model";

interface UserListProps {
  users: UserView[];
  isLoading: boolean;
  error: string | null;
  resetPasswordStatusById: Record<string, ResetUserPasswordStatus>;
  onResetPassword: (userId: string) => void;
}

const RESET_LABEL: Record<ResetUserPasswordStatus, string> = {
  idle: "Redefinir senha",
  loading: "Enviando...",
  sent: "E-mail enviado",
  error: "Tentar de novo",
};

export function UserList({
  users,
  isLoading,
  error,
  resetPasswordStatusById,
  onResetPassword,
}: UserListProps) {
  if (isLoading) {
    return <p className="text-muted-foreground text-sm">Carregando usuários...</p>;
  }

  if (error) {
    return <p className="text-destructive text-sm">{error}</p>;
  }

  if (users.length === 0) {
    return <p className="text-muted-foreground text-sm">Nenhum usuário cadastrado ainda.</p>;
  }

  return (
    <ul className="divide-border border-border bg-card flex flex-col divide-y rounded-[1.5rem] border">
      {users.map((user) => {
        const resetStatus = resetPasswordStatusById[user.id] ?? "idle";

        return (
          <li key={user.id} className="flex items-center justify-between gap-3 px-5 py-3">
            <div className="flex flex-col gap-0.5">
              <span className="text-foreground text-sm font-medium">
                {user.firstName} {user.lastName}
              </span>
              <span className="text-muted-foreground text-xs">{user.email}</span>
              <span className="text-muted-foreground text-xs">{user.phone}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="bg-primary/10 text-primary rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap">
                {CARGO_LABELS[user.cargo]}
              </span>
              <button
                type="button"
                onClick={() => onResetPassword(user.id)}
                disabled={resetStatus === "loading" || resetStatus === "sent"}
                className="text-muted-foreground hover:text-foreground hover:bg-muted flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-60"
              >
                <KeyRound className="size-3.5" />
                {RESET_LABEL[resetStatus]}
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

import { CARGO_LABELS } from "@/modules/users/utils/cargo-options";
import type { UserView } from "@/modules/users/types/user.types";

interface UserListProps {
  users: UserView[];
  isLoading: boolean;
  error: string | null;
}

export function UserList({ users, isLoading, error }: UserListProps) {
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
      {users.map((user) => (
        <li key={user.id} className="flex items-center justify-between gap-3 px-5 py-3">
          <div className="flex flex-col gap-0.5">
            <span className="text-foreground text-sm font-medium">
              {user.firstName} {user.lastName}
            </span>
            <span className="text-muted-foreground text-xs">{user.email}</span>
            <span className="text-muted-foreground text-xs">{user.phone}</span>
          </div>
          <span className="bg-primary/10 text-primary rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap">
            {CARGO_LABELS[user.cargo]}
          </span>
        </li>
      ))}
    </ul>
  );
}

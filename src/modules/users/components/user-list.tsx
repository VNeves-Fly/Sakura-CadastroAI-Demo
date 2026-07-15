import type { UserView } from "@/modules/users/types/user.types";

interface UserListProps {
  users: UserView[];
  isLoading: boolean;
  error: string | null;
}

export function UserList({ users, isLoading, error }: UserListProps) {
  if (isLoading) {
    return <p className="text-sm text-slate-500">Carregando usuários...</p>;
  }

  if (error) {
    return <p className="text-sm text-red-600">{error}</p>;
  }

  if (users.length === 0) {
    return <p className="text-sm text-slate-500">Nenhum usuário cadastrado ainda.</p>;
  }

  return (
    <ul className="flex flex-col divide-y divide-slate-200 rounded-md border border-slate-200">
      {users.map((user) => (
        <li key={user.id} className="flex flex-col gap-0.5 px-4 py-3">
          <span className="text-sm font-medium text-slate-900">{user.name}</span>
          <span className="text-xs text-slate-500">{user.email}</span>
        </li>
      ))}
    </ul>
  );
}

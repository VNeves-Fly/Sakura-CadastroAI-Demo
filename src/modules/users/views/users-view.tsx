"use client";

import { useUsersListViewModel } from "@/modules/users/view-models/use-users-list.view-model";
import { useCreateUserViewModel } from "@/modules/users/view-models/use-create-user.view-model";
import { UserList } from "@/modules/users/components/user-list";
import { CreateUserForm } from "@/modules/users/components/create-user-form";

// View: apenas renderiza, delegando toda a lógica aos ViewModels.
export function UsersView() {
  const { users, isLoading, error } = useUsersListViewModel();
  const { isSubmitting, error: createError, submit } = useCreateUserViewModel();

  return (
    <div className="flex w-full max-w-2xl flex-col gap-6">
      <h1 className="text-xl font-semibold text-slate-900">Usuários</h1>
      <CreateUserForm isSubmitting={isSubmitting} error={createError} onSubmit={submit} />
      <UserList users={users} isLoading={isLoading} error={error} />
    </div>
  );
}

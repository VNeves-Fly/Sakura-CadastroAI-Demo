"use client";

import { useUsersListViewModel } from "@/modules/users/view-models/use-users-list.view-model";
import { useCreateUserViewModel } from "@/modules/users/view-models/use-create-user.view-model";
import { UserList } from "@/modules/users/components/user-list";
import { CreateUserForm } from "@/modules/users/components/create-user-form";
import { CreateUserSuccess } from "@/modules/users/components/create-user-success";

// View: apenas renderiza, delegando toda a lógica aos ViewModels.
export function UsersView() {
  const { users, isLoading, error } = useUsersListViewModel();
  const {
    isSubmitting,
    error: createError,
    submit,
    lastCreatedResult,
    dismissSuccess,
  } = useCreateUserViewModel();

  return (
    <div className="flex w-full max-w-2xl flex-col gap-6">
      <h1 className="text-foreground text-xl font-semibold">Usuários</h1>

      {lastCreatedResult ? (
        <CreateUserSuccess result={lastCreatedResult} onDismiss={dismissSuccess} />
      ) : null}

      <CreateUserForm isSubmitting={isSubmitting} error={createError} onSubmit={submit} />
      <UserList users={users} isLoading={isLoading} error={error} />
    </div>
  );
}

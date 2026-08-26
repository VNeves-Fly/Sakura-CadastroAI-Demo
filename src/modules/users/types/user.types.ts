import type { Cargo } from "@/modules/users/domain/enums";

export interface UserView {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  cargo: Cargo;
  ativo: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

// Form de criação — sem campo de senha (pedido do usuário, 2026-08-26,
// seguindo a SPEC de /usuarios): todo usuário novo nasce com senha
// temporária + e-mail de boas-vindas, sem o admin escolher/digitar nada.
// mustChangePassword/useTemporaryPassword continuam fixos no adapter
// (toServiceInput), não aparecem no form.
export interface CreateUserFormValues {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  cargo: Cargo;
  ativo: boolean;
}

// Payload de fato enviado à API — password é omitido (não vazio) quando
// useTemporaryPassword é true, pra bater com a validação opcional do zod
// (create-user.schema.ts trata "" como inválido, só undefined é opcional).
export interface CreateUserPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  cargo: Cargo;
  password?: string;
  mustChangePassword: boolean;
  useTemporaryPassword: boolean;
  ativo: boolean;
}

// Form de edição — mesmos campos do de criação, mais o switch de status.
// Não tem campo de senha: "Redefinir senha" no modal dispara o link por
// e-mail direto (ver use-reset-user-password.view-model.ts), não edita a
// senha por aqui.
export interface UpdateUserFormValues {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  cargo: Cargo;
  ativo: boolean;
}

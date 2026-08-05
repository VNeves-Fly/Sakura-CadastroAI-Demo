import type { RawGestorResponse } from "@/modules/gestores/services/gestores.service";
import type {
  CreatedGestorResult,
  GestorFormValues,
  GestorPayload,
  GestorView,
} from "@/modules/gestores/types/gestor.types";

export const gestoresAdapter = {
  toServiceInput(values: GestorFormValues): GestorPayload {
    return {
      nome: values.nome.trim(),
      email: values.email.trim() ? values.email.trim().toLowerCase() : null,
      telefone: values.telefone.trim() ? values.telefone.trim() : null,
      baseIds: [...new Set(values.baseIds)],
      criarAcesso: values.criarAcesso,
      password: values.criarAcesso && !values.useTemporaryPassword ? values.password : undefined,
      mustChangePassword: values.mustChangePassword,
      useTemporaryPassword: values.useTemporaryPassword,
    };
  },

  toView(raw: RawGestorResponse): GestorView {
    return {
      id: raw.id,
      nome: raw.nome,
      email: raw.email,
      telefone: raw.telefone,
      temAcesso: raw.userId !== null,
      bases: raw.bases,
      createdAt: raw.createdAt,
    };
  },

  toViewList(raw: RawGestorResponse[]): GestorView[] {
    return raw.map((item) => gestoresAdapter.toView(item));
  },

  toCreatedResult(raw: RawGestorResponse): CreatedGestorResult {
    return {
      gestor: gestoresAdapter.toView(raw),
      temporaryPassword: raw.temporaryPassword,
    };
  },
};

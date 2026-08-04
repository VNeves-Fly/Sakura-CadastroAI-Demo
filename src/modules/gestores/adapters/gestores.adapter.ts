import type { RawGestorResponse } from "@/modules/gestores/services/gestores.service";
import type {
  CreatedGestorResult,
  GestorFormValues,
  GestorPayload,
  GestorView,
} from "@/modules/gestores/types/gestor.types";

function paraBases(basesTexto: string): string[] {
  return [
    ...new Set(
      basesTexto
        .split(",")
        .map((base) => base.trim().toUpperCase())
        .filter(Boolean),
    ),
  ];
}

export const gestoresAdapter = {
  toServiceInput(values: GestorFormValues): GestorPayload {
    return {
      nome: values.nome.trim(),
      email: values.email.trim() ? values.email.trim().toLowerCase() : null,
      telefone: values.telefone.trim() ? values.telefone.trim() : null,
      bases: paraBases(values.basesTexto),
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

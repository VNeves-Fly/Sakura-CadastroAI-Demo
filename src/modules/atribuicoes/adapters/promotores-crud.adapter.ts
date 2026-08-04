import type { RawPromotorResponse } from "@/modules/atribuicoes/services/promotores-crud.service";
import type {
  CreatedPromotorResult,
  PromotorCrudView,
  PromotorFormValues,
  PromotorPayload,
} from "@/modules/atribuicoes/types/promotor-crud.types";

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

export const promotoresCrudAdapter = {
  toServiceInput(values: PromotorFormValues): PromotorPayload {
    return {
      nome: values.nome.trim(),
      sica: values.sica.trim() ? Number(values.sica.trim()) : null,
      email: values.email.trim().toLowerCase(),
      telefone: values.telefone.trim() ? values.telefone.trim() : null,
      gestorId: values.gestorId,
      bases: paraBases(values.basesTexto),
      criarAcesso: values.criarAcesso,
      password: values.criarAcesso && !values.useTemporaryPassword ? values.password : undefined,
      mustChangePassword: values.mustChangePassword,
      useTemporaryPassword: values.useTemporaryPassword,
    };
  },

  toView(raw: RawPromotorResponse): PromotorCrudView {
    return {
      id: raw.id,
      nome: raw.nome,
      sica: raw.sica,
      email: raw.email,
      telefone: raw.telefone,
      gestorId: raw.gestorId,
      bases: raw.bases,
      temAcesso: raw.userId !== null,
    };
  },

  toViewList(raw: RawPromotorResponse[]): PromotorCrudView[] {
    return raw.map((item) => promotoresCrudAdapter.toView(item));
  },

  toCreatedResult(raw: RawPromotorResponse): CreatedPromotorResult {
    return {
      promotor: promotoresCrudAdapter.toView(raw),
      temporaryPassword: raw.temporaryPassword,
    };
  },
};

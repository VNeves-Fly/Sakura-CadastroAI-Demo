import type { RawBaseResponse } from "@/modules/bases/services/bases.service";
import type { BaseFormValues, BasePayload, BaseView } from "@/modules/bases/types/base.types";

export const basesAdapter = {
  toServiceInput(values: BaseFormValues): BasePayload {
    return {
      sigla: values.sigla.trim().toUpperCase(),
      nomeCidade: values.nomeCidade.trim(),
      uf: values.uf.trim().toUpperCase(),
    };
  },

  toView(raw: RawBaseResponse): BaseView {
    return { id: raw.id, sigla: raw.sigla, nomeCidade: raw.nomeCidade, uf: raw.uf };
  },

  toViewList(raw: RawBaseResponse[]): BaseView[] {
    return raw.map((item) => basesAdapter.toView(item));
  },
};

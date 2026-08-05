import type { RawAssociacaoResponse } from "@/modules/associacoes/services/associacoes.service";
import type {
  AssociacaoFormValues,
  AssociacaoPayload,
  AssociacaoView,
} from "@/modules/associacoes/types/associacao.types";

export const associacoesAdapter = {
  toServiceInput(values: AssociacaoFormValues): AssociacaoPayload {
    return { nome: values.nome.trim(), ativo: values.ativo };
  },

  toView(raw: RawAssociacaoResponse): AssociacaoView {
    return { id: raw.id, nome: raw.nome, ativo: raw.ativo };
  },

  toViewList(raw: RawAssociacaoResponse[]): AssociacaoView[] {
    return raw.map((item) => associacoesAdapter.toView(item));
  },
};

import { normalizarNome } from "@/modules/shared/utils/normalizar-nome";
import { paisTelefonePorCodigo } from "@/modules/shared/utils/telefone.util";
import { unmaskCnpj } from "@/modules/cadastro/utils/cnpj.util";
import type {
  RawQsaResponse,
  CriarAgenciaResult,
} from "@/modules/cadastro/services/agencia.service";
import type {
  QsaResultView,
  SocioFormValues,
  SubmitResultView,
} from "@/modules/cadastro/types/agencia.types";

// Traduz dados entre a forma que a View/ViewModel usam e a forma que o
// Service/API externa esperam — nenhuma outra camada do front conhece o
// shape bruto da API.
export const agenciaAdapter = {
  toQsaResultView(raw: RawQsaResponse): QsaResultView {
    return {
      razaoSocial: raw.razaoSocial,
      cnaeCompativel: raw.cnaeCompativel,
      nomesSocios: raw.socios.map((socio) => socio.nome),
    };
  },

  socioCorrespondeAoQsa(nomeDigitado: string, nomesQsa: string[]): boolean {
    const nomeNormalizado = normalizarNome(nomeDigitado);
    return nomesQsa.some((nomeQsa) => normalizarNome(nomeQsa) === nomeNormalizado);
  },

  toSubmitFormData(params: {
    cnpjMascarado: string;
    contratoSocial: File;
    socios: SocioFormValues[];
    origem: string | null;
  }): FormData {
    const formData = new FormData();

    formData.set("cnpj", unmaskCnpj(params.cnpjMascarado));
    if (params.origem) {
      formData.set("origem", params.origem);
    }
    formData.set("contratoSocial", params.contratoSocial);

    const socioMeta = params.socios.map((socio) => {
      const pais = paisTelefonePorCodigo(socio.telefonePais);
      const ddi = pais.ddi ? `${pais.ddi} ` : "";

      return {
        nome: socio.nome,
        email: socio.email,
        telefone: `${ddi}${socio.telefone}`,
      };
    });
    formData.set("socios", JSON.stringify(socioMeta));

    params.socios.forEach((socio, index) => {
      if (socio.rg) {
        formData.set(`socio-${index}-rg`, socio.rg);
      }
    });

    return formData;
  },

  toSubmitResultView(result: CriarAgenciaResult): SubmitResultView {
    if (result.ok) {
      return { success: true, agenciaId: result.data.id };
    }

    return { success: false, duplicado: result.duplicado, error: result.error };
  },
};

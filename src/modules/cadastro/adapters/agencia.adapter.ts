import { paisTelefonePorCodigo } from "@/modules/shared/utils/telefone.util";
import { unmaskCep } from "@/modules/cadastro/utils/cep.util";
import { unmaskCnpj } from "@/modules/cadastro/utils/cnpj.util";
import { unmaskCpf } from "@/modules/cadastro/utils/cpf.util";
import type {
  RawQsaResponse,
  CriarAgenciaResult,
  RawAnaliseContratoSocialResponse,
} from "@/modules/cadastro/services/agencia.service";
import type {
  QsaResultView,
  SubmitResultView,
  ContratoSocialAnaliseView,
} from "@/modules/cadastro/types/agencia.types";
import type { SocioWizardFormValues } from "@/modules/cadastro/types/socio-wizard.types";
import type { EnderecoBancoFormValues } from "@/modules/cadastro/types/endereco-banco.types";

function telefoneComDdi(telefone: string, pais: string): string {
  const ddi = paisTelefonePorCodigo(pais).ddi;
  return ddi ? `${ddi} ${telefone}` : telefone;
}

// Traduz dados entre a forma que a View/ViewModel usam e a forma que o
// Service/API externa esperam — nenhuma outra camada do front conhece o
// shape bruto da API.
export const agenciaAdapter = {
  toQsaConsultaInput(cnpjMascarado: string): string {
    return unmaskCnpj(cnpjMascarado);
  },

  toQsaResultView(raw: RawQsaResponse): QsaResultView {
    return {
      razaoSocial: raw.razaoSocial,
      cnaeCompativel: raw.cnaeCompativel,
      nomesSocios: raw.socios.map((socio) => socio.nome),
      dataAbertura: raw.dataAbertura,
      telefoneReceita: raw.telefoneReceita,
      emailReceita: raw.emailReceita,
    };
  },

  toAnalisarContratoSocialFormData(params: {
    cnpjMascarado: string;
    contratoSocial: File;
  }): FormData {
    const formData = new FormData();
    formData.set("cnpj", unmaskCnpj(params.cnpjMascarado));
    formData.set("contratoSocial", params.contratoSocial);
    return formData;
  },

  toContratoSocialAnaliseView(raw: RawAnaliseContratoSocialResponse): ContratoSocialAnaliseView {
    return {
      cnpjConfere: raw.cnpjConfere,
      nomesSocios: raw.nomesSocios,
      alertas: raw.alertas,
      confianca: raw.confianca,
    };
  },

  toFinalizarCadastroFormData(params: {
    cnpjMascarado: string;
    contratoSocial: File;
    origem: string | null;
    telefoneComercial: string;
    telefoneComercialPais: string;
    semTelefoneComercial: boolean;
    emailOperacional: string;
    emailComercial: string;
    emailFinanceiro: string;
    socios: SocioWizardFormValues[];
    enderecoBanco: EnderecoBancoFormValues;
  }): FormData {
    const formData = new FormData();

    formData.set("cnpj", unmaskCnpj(params.cnpjMascarado));
    if (params.origem) {
      formData.set("origem", params.origem);
    }
    formData.set("contratoSocial", params.contratoSocial);
    formData.set(
      "telefoneComercial",
      telefoneComDdi(params.telefoneComercial, params.telefoneComercialPais),
    );
    formData.set("semTelefoneComercial", String(params.semTelefoneComercial));
    formData.set("emailOperacional", params.emailOperacional);
    formData.set("emailComercial", params.emailComercial);
    formData.set("emailFinanceiro", params.emailFinanceiro);

    const socioMeta = params.socios.map((socio) => ({
      nome: socio.nome,
      cpf: unmaskCpf(socio.cpf),
      email: socio.email,
      telefone: telefoneComDdi(socio.telefone, socio.telefonePais),
      estadoCivil: socio.estadoCivil,
      isRepresentante: socio.isRepresentante,
      endereco: {
        cep: unmaskCep(socio.cep),
        logradouro: socio.logradouro,
        numero: socio.numero,
        complemento: "",
        bairro: socio.bairro,
        cidade: socio.cidade,
        uf: socio.uf,
      },
    }));
    formData.set("socios", JSON.stringify(socioMeta));

    params.socios.forEach((socio, index) => {
      if (socio.rgArquivo) {
        formData.set(`socio-${index}-rg`, socio.rgArquivo);
      }
      if (socio.isRepresentante && socio.procuracaoArquivo) {
        formData.set(`socio-${index}-procuracao`, socio.procuracaoArquivo);
      }
    });

    const socioVinculado =
      params.enderecoBanco.enderecoMesmoSocio &&
      params.enderecoBanco.socioEnderecoVinculado !== null
        ? params.socios[params.enderecoBanco.socioEnderecoVinculado]
        : undefined;

    const endereco = socioVinculado
      ? {
          cep: unmaskCep(socioVinculado.cep),
          logradouro: socioVinculado.logradouro,
          numero: socioVinculado.numero,
          complemento: "",
          bairro: socioVinculado.bairro,
          cidade: socioVinculado.cidade,
          uf: socioVinculado.uf,
        }
      : {
          cep: unmaskCep(params.enderecoBanco.cep),
          logradouro: params.enderecoBanco.logradouro,
          numero: params.enderecoBanco.numero,
          complemento: params.enderecoBanco.complemento,
          bairro: params.enderecoBanco.bairro,
          cidade: params.enderecoBanco.cidade,
          uf: params.enderecoBanco.uf,
        };

    formData.set(
      "enderecoBanco",
      JSON.stringify({
        enderecoMesmoSocio: Boolean(params.enderecoBanco.enderecoMesmoSocio),
        socioEnderecoVinculado: params.enderecoBanco.socioEnderecoVinculado,
        endereco,
        bancoPais: params.enderecoBanco.bancoPais,
        bancoNome: params.enderecoBanco.bancoNome,
        bancoAgencia: params.enderecoBanco.bancoAgencia,
        bancoConta: params.enderecoBanco.bancoConta,
        bancoSwift: params.enderecoBanco.bancoSwift,
        tipoConta: params.enderecoBanco.tipoConta,
        favorecidoEhEmpresa: params.enderecoBanco.favorecidoEhEmpresa,
        favorecidoNome: params.enderecoBanco.favorecidoNome,
        favorecidoDoc: params.enderecoBanco.favorecidoDoc,
      }),
    );

    return formData;
  },

  toSubmitResultView(result: CriarAgenciaResult): SubmitResultView {
    if (result.ok) {
      return {
        success: true,
        agenciaId: result.data.id,
        precisaRevisaoManual: result.data.precisaRevisaoManual,
      };
    }

    return { success: false, duplicado: result.duplicado, error: result.error };
  },
};

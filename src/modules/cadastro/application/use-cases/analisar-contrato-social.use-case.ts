import type { UseCase } from "@/modules/shared/application/use-case";
import type { FileStorage } from "@/modules/cadastro/domain/services/file-storage";
import type { DocumentAnalysisService } from "@/modules/cadastro/domain/services/document-analysis-service";
import { unmaskCnpj } from "@/modules/cadastro/utils/cnpj.util";
import { normalizarEstadoCivil } from "@/modules/cadastro/utils/estado-civil.util";
import type {
  AnalisarContratoSocialInput,
  AnalisarContratoSocialOutput,
  EnderecoContratoSocial,
  SocioContratoSocialExtraido,
} from "@/modules/cadastro/application/dto/analisar-contrato-social.dto";

function extrairString(valor: unknown): string | null {
  return typeof valor === "string" && valor.length > 0 ? valor : null;
}

// Mesma normalização usada em receitaws-qsa-consulta.adapter.ts pro capital
// social vindo da Receita — aceita tanto número quanto string em formato BR
// ("100.000,00").
function extrairCapitalSocial(valor: unknown): number | null {
  if (typeof valor === "number" && Number.isFinite(valor)) return valor;
  if (typeof valor !== "string") return null;

  const normalizado = valor.replace(/\./g, "").replace(",", ".");
  const numero = Number(normalizado);
  return Number.isFinite(numero) ? numero : null;
}

// `participacao` (% ou quantidade de quotas) pode vir como número ou como
// string ("50", "50%", "50,5") — mesmo espírito defensivo do capital social.
function extrairParticipacao(valor: unknown): number | null {
  if (typeof valor === "number" && Number.isFinite(valor)) return valor;
  if (typeof valor !== "string") return null;

  const normalizado = valor.replace("%", "").trim().replace(",", ".");
  const numero = Number(normalizado);
  return Number.isFinite(numero) ? numero : null;
}

// `administrativo`/`ativo` são campos derivados (a IA infere do contexto,
// não são extraídos verbatim) — podem vir como booleano real ou como texto
// "true"/"false" (o schema de origem do Document AI não tem tipo booleano).
function extrairBooleano(valor: unknown): boolean | null {
  if (typeof valor === "boolean") return valor;
  if (typeof valor === "string") {
    if (valor.toLowerCase() === "true") return true;
    if (valor.toLowerCase() === "false") return false;
  }
  return null;
}

// A IA devolve a data em `DD/MM/YYYY` (às vezes já em ISO) — o wizard exige
// `YYYY-MM-DD`. Mesmo helper usado em analisar-documento-identificacao.use-case.ts.
function extrairDataNascimentoIso(valor: unknown): string | null {
  if (typeof valor !== "string") return null;

  const isoMatch = valor.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const brMatch = valor.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);

  const match = isoMatch ?? brMatch;
  if (!match) return null;

  const [ano, mes, dia] = isoMatch
    ? [match[1], match[2], match[3]]
    : [match[3], match[2], match[1]];
  if (!ano || !mes || !dia) return null;

  const iso = `${ano}-${mes}-${dia}`;
  const data = new Date(`${iso}T00:00:00`);
  const dataValida =
    !Number.isNaN(data.getTime()) &&
    data.getFullYear() === Number(ano) &&
    data.getMonth() + 1 === Number(mes) &&
    data.getDate() === Number(dia);

  return dataValida ? iso : null;
}

// `endereco` é um objeto confirmado no schema do agente (document_type.py,
// AgentsService) — cep/logradouro/numero/complemento/bairro/municipio/uf.
// Mesma forma usada pro endereço da empresa e pro endereço de cada sócio
// dentro de `qsa`.
function extrairEndereco(valor: unknown): EnderecoContratoSocial | null {
  if (typeof valor !== "object" || valor === null) return null;
  const registro = valor as Record<string, unknown>;

  const endereco: EnderecoContratoSocial = {
    cep: extrairString(registro.cep),
    logradouro: extrairString(registro.logradouro),
    numero: extrairString(registro.numero),
    complemento: extrairString(registro.complemento),
    bairro: extrairString(registro.bairro),
    municipio: extrairString(registro.municipio),
    uf: extrairString(registro.uf),
  };

  const temAlgumCampo = Object.values(endereco).some((campo) => campo !== null);
  return temAlgumCampo ? endereco : null;
}

// `qsa` é uma lista de objetos (substituiu o antigo `socios_nomes_completos`,
// que só tinha nomes soltos) — cada item traz nome, cpf, data de nascimento,
// RG, endereço e mais, conforme o schema do agente (document_type.py).
// Sócios sem nome legível são descartados (não há como identificá-los).
function extrairSocios(camposExtraidos: Record<string, unknown>): SocioContratoSocialExtraido[] {
  const lista = camposExtraidos.qsa;
  if (!Array.isArray(lista)) return [];

  return lista
    .map((item): SocioContratoSocialExtraido | null => {
      if (typeof item !== "object" || item === null) return null;
      const registro = item as Record<string, unknown>;
      const nome = extrairString(registro.nome);
      if (!nome) return null;

      return {
        nome,
        cpf: extrairString(registro.cpf),
        dataNascimento: extrairDataNascimentoIso(registro.data_nascimento),
        estadoCivil: normalizarEstadoCivil(registro.estado_civil),
        nacionalidade: extrairString(registro.nacionalidade),
        regimeBens: extrairString(registro.regime_bens),
        participacao: extrairParticipacao(registro.participacao),
        rg: extrairString(registro.rg),
        rgExpedidor: extrairString(registro.rg_expedidor),
        rgExpedidoUf: extrairString(registro.rg_expedido_uf),
        endereco: extrairEndereco(registro.endereco),
        administrativo: extrairBooleano(registro.administrativo),
        ativo: extrairBooleano(registro.ativo),
      };
    })
    .filter((item): item is SocioContratoSocialExtraido => item !== null);
}

// Análise "preview" no Passo 1 do wizard, antes do cadastro existir de
// verdade — sobe o contrato social pra uma agência que ainda não foi
// criada e chama o mesmo DocumentAnalysisService que o FinalizarCadastroUseCase
// usa depois (na análise final, o arquivo é re-enviado; essa duplicação é
// aceitável pelo ganho de UX de avisar o usuário cedo).
export class AnalisarContratoSocialUseCase implements UseCase<
  AnalisarContratoSocialInput,
  AnalisarContratoSocialOutput
> {
  constructor(
    private readonly fileStorage: FileStorage,
    private readonly documentAnalysisService: DocumentAnalysisService,
  ) {}

  async execute(input: AnalisarContratoSocialInput): Promise<AnalisarContratoSocialOutput> {
    const contratoSocialSalvo = await this.fileStorage.save(
      input.contratoSocial,
      `agencias/${input.cnpj}/contrato-social-preview`,
    );

    const resultado = await this.documentAnalysisService.analisar({
      cnpj: input.cnpj,
      documentPath: contratoSocialSalvo.path,
      documentType: "contrato_social",
    });

    const cnpjExtraido = extrairString(resultado.camposExtraidos.cnpj);

    return {
      cnpjConfere: cnpjExtraido ? unmaskCnpj(cnpjExtraido) === input.cnpj : null,
      socios: extrairSocios(resultado.camposExtraidos),
      alertas: resultado.alertas,
      confianca: resultado.confiancaExtracao,
      resumoAnalise: resultado.resumoAnalise,
      camposObrigatoriosPresentes: resultado.checagens?.camposObrigatoriosPresentes ?? null,
      camposExtras: resultado.camposExtras,
      razaoSocialExtraida: extrairString(resultado.camposExtraidos.razao_social),
      capitalSocial: extrairCapitalSocial(resultado.camposExtraidos.capital_social),
      enderecoEmpresa: extrairEndereco(resultado.camposExtraidos.endereco),
      objetoSocial: extrairString(resultado.camposExtraidos.objeto_social),
      dataConstituicao: extrairString(resultado.camposExtraidos.data_constituicao),
    };
  }
}

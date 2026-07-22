// LEGADO — sem chamador ativo (ver ConsultarQsaUseCase). Mantido por
// decisão do usuário para eventual uso futuro.
import type {
  QsaConsultaService,
  QsaResult,
  QsaEndereco,
  QsaCnae,
} from "@/modules/cadastro/domain/services/qsa-consulta-service";

// Integração real com a API Comercial do ReceitaWS
// (https://developers.receitaws.com.br/receitaws.yaml). Usa
// GET /v1/cnpj/{cnpj}/days/{days} com Authorization: Bearer <token> em vez
// da API Pública (GET /v1/cnpj/{cnpj}, sem auth) porque a pública só
// devolve CNPJs já em cache e tem limite de 3 consultas/min compartilhado
// entre todos os usuários do site — inviável com tráfego real.
//
// `days` é a defasagem máxima do cache: se o CNPJ foi atualizado há menos
// de RECEITAWS_MAX_DAYS dias, devolve do cache (rápido, não conta como
// consulta em tempo real); caso contrário, consulta a Receita Federal ao
// vivo. Ambos os casos respondem HTTP 200 com `status: "OK"` — erros
// (CNPJ inválido/rejeitado) também vêm como 200 com `status: "ERROR"`.
const BASE_URL = "https://receitaws.com.br/v1";
const DEFAULT_MAX_DAYS = 30;

interface ReceitaWsSocio {
  nome: string;
  qual?: string;
}

interface ReceitaWsAtividade {
  code: string;
  text: string;
}

interface ReceitaWsSuccess {
  status: "OK";
  cnpj: string;
  nome: string;
  atividade_principal?: ReceitaWsAtividade[];
  atividades_secundarias?: ReceitaWsAtividade[];
  qsa?: ReceitaWsSocio[];
  abertura: string;
  telefone: string;
  email: string;
  // Campos abaixo vêm da API comercial (não documentados no adapter até
  // agora) — nomes conhecidos publicamente, não confirmados contra uma
  // resposta real neste projeto. Extraídos defensivamente (ver
  // extrairString/extrairNumero/extrairEndereco abaixo).
  situacao?: unknown;
  natureza_juridica?: unknown;
  porte?: unknown;
  capital_social?: unknown;
  simples?: { optante?: unknown; data_opcao?: unknown };
  logradouro?: unknown;
  numero?: unknown;
  complemento?: unknown;
  bairro?: unknown;
  municipio?: unknown;
  uf?: unknown;
  cep?: unknown;
}

function extrairString(valor: unknown): string | null {
  return typeof valor === "string" && valor.length > 0 ? valor : null;
}

// ReceitaWS devolve capital_social como string formatada (ex:
// "10.000,00") — remove separador de milhar e troca vírgula por ponto
// antes de converter; nunca lança em formato inesperado.
function extrairCapitalSocial(valor: unknown): number | null {
  if (typeof valor === "number" && Number.isFinite(valor)) return valor;
  if (typeof valor !== "string") return null;

  const normalizado = valor.replace(/\./g, "").replace(",", ".");
  const numero = Number(normalizado);
  return Number.isFinite(numero) ? numero : null;
}

function extrairEndereco(resultado: ReceitaWsSuccess): QsaEndereco | null {
  const endereco: QsaEndereco = {
    logradouro: extrairString(resultado.logradouro),
    numero: extrairString(resultado.numero),
    complemento: extrairString(resultado.complemento),
    bairro: extrairString(resultado.bairro),
    cidade: extrairString(resultado.municipio),
    uf: extrairString(resultado.uf),
    cep: extrairString(resultado.cep),
  };

  const temAlgumCampo = Object.values(endereco).some((campo) => campo !== null);
  return temAlgumCampo ? endereco : null;
}

function extrairCnaes(resultado: ReceitaWsSuccess): QsaCnae[] {
  const principal = (resultado.atividade_principal ?? []).map((atividade) => ({
    codigo: extrairString(atividade.code),
    descricao: extrairString(atividade.text),
    principal: true,
  }));
  const secundarios = (resultado.atividades_secundarias ?? []).map((atividade) => ({
    codigo: extrairString(atividade.code),
    descricao: extrairString(atividade.text),
    principal: false,
  }));
  return [...principal, ...secundarios];
}

interface ReceitaWsError {
  status: "ERROR";
  message: string;
}

export class ReceitaWsQsaConsultaAdapter implements QsaConsultaService {
  async consultar(cnpj: string): Promise<QsaResult | null> {
    const days = process.env.RECEITAWS_MAX_DAYS ?? String(DEFAULT_MAX_DAYS);
    const response = await fetch(`${BASE_URL}/cnpj/${cnpj}/days/${days}?fallback=cacheOnError`, {
      headers: { Authorization: `Bearer ${requireApiToken()}` },
    });

    // 402 (limite de consultas excedido) e 504 (timeout na consulta em
    // tempo real) não são erros de programação — são o serviço externo
    // indisponível no momento. QSA nunca bloqueia o cadastro, então trata
    // como "sem dado" em vez de derrubar o cadastro inteiro.
    if (response.status === 402 || response.status === 504) {
      return null;
    }

    // A spec do ReceitaWS documenta CNPJ inválido/rejeitado como resposta
    // 200 com `status: "ERROR"`, mas na prática o serviço responde 400
    // nesses casos — o corpo tem o mesmo formato `{status, message}`
    // independente do HTTP status, então lemos o JSON antes de decidir se
    // é erro de programação (não conseguimos nem parsear) ou só "sem dado".
    const resultado = (await response.json().catch(() => null)) as
      ReceitaWsSuccess | ReceitaWsError | null;

    if (!resultado) {
      throw new Error(`ReceitaWS respondeu ${response.status} sem corpo JSON válido.`);
    }
    if (!response.ok && resultado.status !== "ERROR") {
      throw new Error(`ReceitaWS respondeu ${response.status}: ${JSON.stringify(resultado)}`);
    }
    if (resultado.status !== "OK") {
      return null;
    }

    return {
      cnpj,
      razaoSocial: resultado.nome,
      cnaeCompativel: this.ehCnaeDeAgenciaDeViagem(resultado.atividade_principal),
      socios: (resultado.qsa ?? []).map((socio) => ({ nome: socio.nome })),
      dataAbertura: resultado.abertura,
      telefoneReceita: resultado.telefone,
      emailReceita: resultado.email,
      situacaoCadastral: extrairString(resultado.situacao),
      naturezaJuridica: extrairString(resultado.natureza_juridica),
      porte: extrairString(resultado.porte),
      capitalSocial: extrairCapitalSocial(resultado.capital_social),
      optanteSimples: resultado.simples?.optante === true,
      dataOpcaoSimples: extrairString(resultado.simples?.data_opcao),
      endereco: extrairEndereco(resultado),
      cnaes: extrairCnaes(resultado),
    };
  }

  // Heurística simples: CNAE divisão 79 = "Agências de viagens, operadores
  // turísticos e serviços de reservas". Hoje `cnaeCompativel` só é exibido
  // como informação (não bloqueia o cadastro), então um falso
  // positivo/negativo aqui não trava ninguém — mas vale revisar se algum
  // dia isso virar critério de aprovação.
  private ehCnaeDeAgenciaDeViagem(atividades?: Array<{ code: string }>): boolean {
    const codigoPrincipal = atividades?.[0]?.code.replace(/\D/g, "");
    return codigoPrincipal?.startsWith("79") ?? false;
  }
}

function requireApiToken(): string {
  const token = process.env.RECEITAWS_API_TOKEN;
  if (!token) {
    throw new Error(
      "RECEITAWS_API_TOKEN não configurada — necessária para ReceitaWsQsaConsultaAdapter.",
    );
  }
  return token;
}

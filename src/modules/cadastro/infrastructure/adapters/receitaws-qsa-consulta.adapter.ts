import type {
  QsaConsultaService,
  QsaResult,
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

interface ReceitaWsSuccess {
  status: "OK";
  cnpj: string;
  nome: string;
  atividade_principal?: Array<{ code: string; text: string }>;
  qsa?: ReceitaWsSocio[];
  abertura: string;
  telefone: string;
  email: string;
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

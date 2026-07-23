import type {
  Banco,
  BancoConsultaService,
} from "@/modules/cadastro/domain/services/banco-consulta-service";

// BrasilAPI espelha a lista de participantes do SPB publicada pelo Banco
// Central (sem autenticação, sem limite de taxa documentado) — ver
// https://brasilapi.com.br/api/banks/v1. A lista muda raramente (só
// quando uma instituição entra/sai do sistema), por isso cacheamos por
// 24h via `next.revalidate` em vez de bater na API a cada abertura do
// dropdown.
const BASE_URL = "https://brasilapi.com.br/api/banks/v1";
const REVALIDATE_SECONDS = 60 * 60 * 24;

interface BrasilApiBanco {
  ispb: string;
  name: string;
  code: number | null;
  fullName: string;
}

export class BrasilApiBancoConsultaAdapter implements BancoConsultaService {
  async listar(): Promise<Banco[]> {
    const response = await fetch(BASE_URL, {
      next: { revalidate: REVALIDATE_SECONDS },
    });

    if (!response.ok) {
      throw new Error(`BrasilAPI respondeu ${response.status} ao listar bancos.`);
    }

    const resultado = (await response.json()) as BrasilApiBanco[];

    // `code: null` cobre sistemas do BC sem código bancário real (Selic,
    // Bacen, STN etc.) e `code: 0` são registros sem COMPE atribuído —
    // nenhum dos dois é selecionável pra dados bancários de TED/DOC.
    return resultado
      .filter((banco) => typeof banco.code === "number" && banco.code > 0)
      .map((banco) => ({
        codigo: String(banco.code),
        nome: banco.name,
        nomeCompleto: banco.fullName,
      }))
      .sort((a, b) => Number(a.codigo) - Number(b.codigo));
  }
}

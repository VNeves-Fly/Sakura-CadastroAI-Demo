import type {
  SicaConsultaResultado,
  SicaEmpresaRegistro,
  SstService,
} from "@/modules/cadastro/domain/services/sst-service";
import {
  sstBaseUrl,
  requireSstApiKey,
} from "@/modules/cadastro/infrastructure/adapters/flysakura-sst-http.util";

// Shape bruto de GET /api/agencias/ativas (snake_case, confirmado pelo
// usuário via exemplo real, 2026-08-02) — `data` vem vazio (`[]`) quando
// não encontra nada pro parâmetro buscado.
interface RawAgenciaAtivaSst {
  codigo_empresa: number;
  nome: string;
  cnpj: string;
  telefone: string;
  email: string;
  empresa_status: string;
  codigo_executivo: number;
  nome_executivo: string;
}

interface RawAgenciasAtivasResponse {
  data: RawAgenciaAtivaSst[];
  total: number;
  page: number;
  offset: number;
}

function paraRegistro(raw: RawAgenciaAtivaSst): SicaEmpresaRegistro {
  return {
    codigoEmpresa: raw.codigo_empresa,
    nome: raw.nome,
    cnpj: raw.cnpj,
    telefone: raw.telefone,
    email: raw.email,
    // `empresa_status` é sempre "ativo"/"inativo" hoje (confirmado pelo
    // usuário) — sem validação extra de shape, mesma confiança dada ao
    // resto dos campos desta resposta.
    empresaStatus: raw.empresa_status as "ativo" | "inativo",
    codigoExecutivo: raw.codigo_executivo,
    nomeExecutivo: raw.nome_executivo,
  };
}

// Integração real com o SST (sst.flysakura.com) — GET /api/agencias/ativas,
// buscável por `cnpj` (checagem automática ao finalizar o cadastro, ver
// AnalisarCadastroUseCase) ou por `codigoEmpresa` (confirmação do código
// SICA digitado manualmente, ver SalvarSicaUseCase) — mesmo endpoint,
// parâmetro diferente.
export class FlysakuraSstAdapter implements SstService {
  async consultarSicaCNPJ(cnpj: string): Promise<SicaConsultaResultado> {
    return this.consultar("cnpj", cnpj);
  }

  async consultarSicaCodigoEmpresa(codigoEmpresa: number): Promise<SicaConsultaResultado> {
    return this.consultar("codigoEmpresa", String(codigoEmpresa));
  }

  private async consultar(
    parametro: "cnpj" | "codigoEmpresa",
    valor: string,
  ): Promise<SicaConsultaResultado> {
    const url = new URL("/api/agencias/ativas", sstBaseUrl());
    url.searchParams.set(parametro, valor);
    url.searchParams.set("realtime", "true");

    const response = await fetch(url, {
      headers: {
        accept: "application/json",
        "X-Internal-Secret": requireSstApiKey(),
      },
    });

    if (!response.ok) {
      throw new Error(`SST respondeu ${response.status}: ${await response.text()}`);
    }

    const resultado = (await response.json()) as RawAgenciasAtivasResponse;
    const primeiro = resultado.data?.[0];

    return {
      encontrado: primeiro !== undefined,
      registro: primeiro ? paraRegistro(primeiro) : null,
    };
  }
}

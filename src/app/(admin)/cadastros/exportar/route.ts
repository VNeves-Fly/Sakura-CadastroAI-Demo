import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { nextAuthOptions } from "@/modules/auth/presentation/routes/next-auth.options";
import { cadastroAdminController } from "@/modules/cadastro/presentation/controllers/cadastro-admin.controller";
import { atendimentoController } from "@/modules/atendimento/presentation/controllers/atendimento.controller";
import { maskCnpj } from "@/modules/cadastro/utils/cnpj.util";
import { labelStatus } from "@/modules/admin/utils/status-cadastro.util";
import { resolverFiltrosCadastros } from "@/modules/admin/utils/resolver-filtros-cadastros.util";

function formatarData(data: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(data);
}

// Separador ";" em vez de "," — convenção pt-BR (Excel local usa "," como
// separador decimal, então importa CSV corretamente só com ";").
function linhaCsv(campos: string[]): string {
  return campos
    .map((campo) => (/[";\n]/.test(campo) ? `"${campo.replace(/"/g, '""')}"` : campo))
    .join(";");
}

const CABECALHO = [
  "Agência",
  "CNPJ",
  "Status",
  "Cadastro",
  "Base",
  "Executivo",
  "Gestor",
  "Associação",
  "SICA",
  "Atendimento",
];

// Mesmo filtro da tabela de /cadastros (ver resolverFiltrosCadastros),
// mas ignorando paginação/tamanho de página — o CSV sempre sai completo,
// nunca só da página visível na tela (ver ListarCadastrosFiltros.todos).
export async function GET(request: Request) {
  const session = await getServerSession(nextAuthOptions);
  const analistaId = session?.user?.id ?? "";
  const cargo = session?.user?.cargo;

  const url = new URL(request.url);
  const { filtros } = await resolverFiltrosCadastros(
    {
      busca: url.searchParams.get("busca") ?? undefined,
      status: url.searchParams.getAll("status"),
      sort: url.searchParams.get("sort") ?? undefined,
      dir: url.searchParams.get("dir") ?? undefined,
      filtro: url.searchParams.getAll("filtro"),
      meusAtendimentos: url.searchParams.get("meusAtendimentos") ?? undefined,
    },
    { analistaId, cargo },
  );

  const { items } = await cadastroAdminController.listarCadastros({ ...filtros, todos: true });

  const agenciaIds = items.map(({ agencia }) => agencia.id);
  const [atendimentosAtivos, ultimosAtendimentosEncerrados] = await Promise.all([
    atendimentoController.listarAtendimentosAgenciaAtivos(agenciaIds),
    atendimentoController.listarUltimoAtendimentoAgenciaEncerrado(agenciaIds),
  ]);
  const atendimentoAtivoPorAgencia = new Map(
    atendimentosAtivos.map((registro) => [registro.agenciaId, registro]),
  );
  const ultimoEncerradoPorAgencia = new Map(
    ultimosAtendimentosEncerrados.map((registro) => [registro.agenciaId, registro]),
  );

  const linhas = items.map(
    ({ agencia, associacaoNome, executivoNome, executivoGestor, consultaSicaMaisRecente }) => {
      const atendimento =
        atendimentoAtivoPorAgencia.get(agencia.id)?.analistaNome ??
        ultimoEncerradoPorAgencia.get(agencia.id)?.analistaNome ??
        "";
      return linhaCsv([
        agencia.razaoSocial,
        maskCnpj(agencia.cnpj),
        labelStatus(agencia.status),
        formatarData(agencia.createdAt),
        "",
        executivoNome ?? "",
        executivoGestor ?? "",
        associacaoNome ?? "",
        consultaSicaMaisRecente?.codigoEmpresa != null
          ? String(consultaSicaMaisRecente.codigoEmpresa)
          : "",
        atendimento,
      ]);
    },
  );

  // BOM UTF-8 no início — sem ele o Excel abre acentos como caracteres
  // corrompidos.
  const BOM_UTF8 = String.fromCharCode(0xfeff);
  const csv = BOM_UTF8 + [linhaCsv(CABECALHO), ...linhas].join("\r\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="cadastros.csv"',
    },
  });
}

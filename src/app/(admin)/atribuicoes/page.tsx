import { AbasNav } from "@/modules/atribuicoes/components/abas-nav";
import { FiltrosAtribuicoes } from "@/modules/atribuicoes/components/filtros-atribuicoes";
import { ResumoSelecao } from "@/modules/atribuicoes/components/resumo-selecao";
import { RegioesTab } from "@/modules/atribuicoes/components/regioes-tab";
import { BasesTab } from "@/modules/atribuicoes/components/bases-tab";
import { ExecutivosTab } from "@/modules/atribuicoes/components/executivos-tab";
import { GestoresTab } from "@/modules/atribuicoes/components/gestores-tab";
import { CidadesTab } from "@/modules/atribuicoes/components/cidades-tab";
import { RemanejarTab } from "@/modules/atribuicoes/components/remanejar-tab";
import { GerarLinkAtribuicoesButton } from "@/modules/atribuicoes/components/gerar-link-atribuicoes-button";
import {
  carregarCidades,
  filtrarCidades,
  agregarRegioes,
  agregarBases,
  agregarExecutivos,
  agregarGestores,
  paraExecutivosView,
  paraGestoresView,
} from "@/modules/atribuicoes/utils/agregacoes.util";
import { atribuicoesAdminController } from "@/modules/atribuicoes/presentation/controllers/atribuicoes-admin.controller";

const TAMANHO_PAGINA = 50;

interface AtribuicoesPageProps {
  searchParams: {
    aba?: string;
    busca?: string;
    regiao?: string;
    base?: string;
    executivo?: string;
    gestor?: string;
    pagina?: string;
  };
}

export default async function AtribuicoesPage({ searchParams }: AtribuicoesPageProps) {
  const aba = searchParams.aba ?? "regioes";
  const busca = searchParams.busca ?? "";
  const regiao = searchParams.regiao ?? "";
  const base = searchParams.base ?? "";
  const executivo = searchParams.executivo ?? "";
  const gestor = searchParams.gestor ?? "";

  const [todasCidades, promotores, associacoesTodas] = await Promise.all([
    Promise.resolve(carregarCidades()),
    atribuicoesAdminController.listarPromotores(),
    atribuicoesAdminController.listarAssociacoes(),
  ]);
  const executivosLink = promotores.map((promotor) => ({ id: promotor.id, nome: promotor.nome }));
  const associacoesLink = associacoesTodas
    .filter((associacao) => associacao.ativo)
    .map((associacao) => ({ id: associacao.id, nome: associacao.nome }));
  const cidadesFiltradas = filtrarCidades(todasCidades, { busca, regiao, base, executivo, gestor });

  const regioes = agregarRegioes(cidadesFiltradas);
  const bases = agregarBases(cidadesFiltradas);
  // Identidade real (tabela Promotor, todo mundo com SICA) pras abas
  // Executivos/Gestores — cruzada com o recorte filtrado de cidades só
  // pras estatísticas de base/cidades atendidas, nunca pra decidir quem
  // aparece na lista (isso vem sempre da planilha inteira).
  const executivosView = paraExecutivosView(promotores, cidadesFiltradas);
  const gestoresView = paraGestoresView(promotores, cidadesFiltradas);
  // Cidades-mock puro (nomes abreviados) — usado só pelos filtros/
  // Remanejar/resumo de seleção, que mexem exatamente nesses valores.
  const executivos = agregarExecutivos(cidadesFiltradas);
  const gestores = agregarGestores(cidadesFiltradas);

  // Opções de cada select em cascata: calculadas a partir dos OUTROS
  // filtros já aplicados (nunca do próprio), pra só oferecer combinações
  // coerentes — ex.: escolher executivo=Douglas estreita as opções de
  // Região/Base/Gestor pras que Douglas realmente atende, em vez de
  // deixar montar uma combinação que não existe nos dados e só dar
  // "nenhuma cidade encontrada" depois de filtrar.
  const opcoesRegiao = agregarRegioes(
    filtrarCidades(todasCidades, { busca, base, executivo, gestor }),
  ).map((item) => item.regiao);
  const opcoesBase = agregarBases(
    filtrarCidades(todasCidades, { busca, regiao, executivo, gestor }),
  ).map((item) => item.base);
  const opcoesExecutivo = agregarExecutivos(
    filtrarCidades(todasCidades, { busca, regiao, base, gestor }),
  ).map((item) => item.executivo);
  const opcoesGestor = agregarGestores(
    filtrarCidades(todasCidades, { busca, regiao, base, executivo }),
  ).map((item) => item.gestor);

  // Remanejar mexe no cadastro inteiro (todas as cidades daquele nome
  // vão pro substituto), não só no recorte filtrado — sempre lista tudo,
  // independente dos filtros ativos nas outras abas.
  const todosExecutivos = agregarExecutivos(todasCidades);
  const todosGestores = agregarGestores(todasCidades);
  const todasBases = agregarBases(todasCidades);

  const regiaoResumo = regiao ? (regioes.find((item) => item.regiao === regiao) ?? null) : null;
  const baseResumo = base ? (bases.find((item) => item.base === base) ?? null) : null;
  const executivoResumo = executivo
    ? (executivos.find((item) => item.executivo === executivo) ?? null)
    : null;
  const gestorResumo = gestor ? (gestores.find((item) => item.gestor === gestor) ?? null) : null;

  const pagina = Math.max(1, Number(searchParams.pagina) || 1);
  const totalPaginas = Math.max(1, Math.ceil(cidadesFiltradas.length / TAMANHO_PAGINA));
  const paginaEfetiva = Math.min(pagina, totalPaginas);
  const cidadesPagina = cidadesFiltradas.slice(
    (paginaEfetiva - 1) * TAMANHO_PAGINA,
    paginaEfetiva * TAMANHO_PAGINA,
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-foreground text-lg font-bold">Atribuições</h1>
          <p className="text-muted-foreground text-sm">
            Hierarquia comercial — Agência → Executivo → Gestor → Diretor, organizada por Base e
            Região.
          </p>
        </div>
        <GerarLinkAtribuicoesButton executivos={executivosLink} associacoes={associacoesLink} />
      </div>

      {aba !== "remanejar" ? (
        <>
          <FiltrosAtribuicoes
            aba={aba}
            busca={busca}
            regiaoSelecionada={regiao}
            baseSelecionada={base}
            executivoSelecionado={executivo}
            gestorSelecionado={gestor}
            regioes={opcoesRegiao}
            bases={opcoesBase}
            executivos={opcoesExecutivo}
            gestores={opcoesGestor}
          />

          <ResumoSelecao
            regiao={regiaoResumo}
            base={baseResumo}
            executivo={executivoResumo}
            gestor={gestorResumo}
          />
        </>
      ) : null}

      <div className="border-border bg-card overflow-hidden rounded-2xl border">
        <AbasNav
          abaAtiva={aba}
          busca={busca}
          regiao={regiao}
          base={base}
          executivo={executivo}
          gestor={gestor}
        />
        {aba === "bases" ? (
          <BasesTab bases={bases} />
        ) : aba === "executivos" ? (
          <ExecutivosTab executivos={executivosView} />
        ) : aba === "gestores" ? (
          <GestoresTab gestores={gestoresView} />
        ) : aba === "cidades" ? (
          <CidadesTab
            cidades={cidadesPagina}
            totalFiltrado={cidadesFiltradas.length}
            paginaAtual={paginaEfetiva}
            totalPaginas={totalPaginas}
            busca={busca}
            regiao={regiao}
            base={base}
            executivo={executivo}
            gestor={gestor}
          />
        ) : aba === "remanejar" ? (
          <RemanejarTab executivos={todosExecutivos} gestores={todosGestores} bases={todasBases} />
        ) : (
          <RegioesTab regioes={regioes} />
        )}
      </div>
    </div>
  );
}

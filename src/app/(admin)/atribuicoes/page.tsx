import { AbasNav } from "@/modules/atribuicoes/components/abas-nav";
import { FiltrosAtribuicoes } from "@/modules/atribuicoes/components/filtros-atribuicoes";
import { ResumoSelecao } from "@/modules/atribuicoes/components/resumo-selecao";
import { RegioesTab } from "@/modules/atribuicoes/components/regioes-tab";
import { BasesTab } from "@/modules/atribuicoes/components/bases-tab";
import { ExecutivosTab } from "@/modules/atribuicoes/components/executivos-tab";
import { GestoresTab } from "@/modules/atribuicoes/components/gestores-tab";
import { CidadesTab } from "@/modules/atribuicoes/components/cidades-tab";
import {
  carregarCidades,
  filtrarCidades,
  agregarRegioes,
  agregarBases,
  agregarExecutivos,
  agregarGestores,
} from "@/modules/atribuicoes/utils/agregacoes.util";

const TAMANHO_PAGINA = 50;

interface AtribuicoesPageProps {
  searchParams: {
    aba?: string;
    busca?: string;
    executivo?: string;
    gestor?: string;
    pagina?: string;
  };
}

export default function AtribuicoesPage({ searchParams }: AtribuicoesPageProps) {
  const aba = searchParams.aba ?? "regioes";
  const busca = searchParams.busca ?? "";
  const executivo = searchParams.executivo ?? "";
  const gestor = searchParams.gestor ?? "";

  const todasCidades = carregarCidades();
  const cidadesFiltradas = filtrarCidades(todasCidades, { busca, executivo, gestor });

  const regioes = agregarRegioes(cidadesFiltradas);
  const bases = agregarBases(cidadesFiltradas);
  const executivos = agregarExecutivos(cidadesFiltradas);
  const gestores = agregarGestores(cidadesFiltradas);

  // Listas completas (não filtradas) pros selects — senão a opção
  // escolhida "some" da lista assim que o filtro é aplicado.
  const todosExecutivos = agregarExecutivos(todasCidades).map((item) => item.executivo);
  const todosGestores = agregarGestores(todasCidades).map((item) => item.gestor);

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
      <div>
        <h1 className="text-foreground text-lg font-bold">Atribuições</h1>
        <p className="text-muted-foreground text-sm">
          Hierarquia comercial — Agência → Executivo → Gestor → Diretor, organizada por Base e
          Região.
        </p>
      </div>

      <FiltrosAtribuicoes
        aba={aba}
        busca={busca}
        executivoSelecionado={executivo}
        gestorSelecionado={gestor}
        executivos={todosExecutivos}
        gestores={todosGestores}
      />

      <ResumoSelecao executivo={executivoResumo} gestor={gestorResumo} />

      <div className="border-border bg-card overflow-hidden rounded-2xl border">
        <AbasNav abaAtiva={aba} busca={busca} executivo={executivo} gestor={gestor} />
        {aba === "bases" ? (
          <BasesTab bases={bases} />
        ) : aba === "executivos" ? (
          <ExecutivosTab executivos={executivos} />
        ) : aba === "gestores" ? (
          <GestoresTab gestores={gestores} />
        ) : aba === "cidades" ? (
          <CidadesTab
            cidades={cidadesPagina}
            totalFiltrado={cidadesFiltradas.length}
            paginaAtual={paginaEfetiva}
            totalPaginas={totalPaginas}
            busca={busca}
            executivo={executivo}
            gestor={gestor}
          />
        ) : (
          <RegioesTab regioes={regioes} />
        )}
      </div>
    </div>
  );
}

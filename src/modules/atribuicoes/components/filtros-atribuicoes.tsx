interface FiltrosAtribuicoesProps {
  aba: string;
  busca: string;
  regiaoSelecionada: string;
  baseSelecionada: string;
  executivoSelecionado: string;
  gestorSelecionado: string;
  regioes: string[];
  bases: string[];
  executivos: string[];
  gestores: string[];
}

const selectClassName =
  "border-input bg-background text-foreground focus:border-primary focus:ring-ring/30 rounded-full border px-4 py-2 text-sm outline-none focus:ring-2";

export function FiltrosAtribuicoes({
  aba,
  busca,
  regiaoSelecionada,
  baseSelecionada,
  executivoSelecionado,
  gestorSelecionado,
  regioes,
  bases,
  executivos,
  gestores,
}: FiltrosAtribuicoesProps) {
  return (
    <form className="flex flex-col gap-3" action="/atribuicoes" method="GET">
      <input type="hidden" name="aba" value={aba} />
      <input
        type="text"
        name="busca"
        defaultValue={busca}
        placeholder="Buscar por cidade, estado, base, executivo ou gestor"
        className="border-input bg-background text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-ring/30 w-full rounded-full border px-4 py-2 text-sm outline-none focus:ring-2"
      />
      <div className="flex flex-wrap items-center gap-2">
        <select name="regiao" defaultValue={regiaoSelecionada} className={selectClassName}>
          <option value="">Todas as regiões</option>
          {regioes.map((regiao) => (
            <option key={regiao} value={regiao}>
              {regiao}
            </option>
          ))}
        </select>
        <select name="base" defaultValue={baseSelecionada} className={selectClassName}>
          <option value="">Todas as bases</option>
          {bases.map((base) => (
            <option key={base} value={base}>
              {base}
            </option>
          ))}
        </select>
        <select name="executivo" defaultValue={executivoSelecionado} className={selectClassName}>
          <option value="">Todos os executivos</option>
          {executivos.map((executivo) => (
            <option key={executivo} value={executivo}>
              {executivo}
            </option>
          ))}
        </select>
        <select name="gestor" defaultValue={gestorSelecionado} className={selectClassName}>
          <option value="">Todos os gestores</option>
          {gestores.map((gestor) => (
            <option key={gestor} value={gestor}>
              {gestor}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="bg-primary text-primary-foreground hover:bg-sakura-600 shrink-0 rounded-full px-4 py-2 text-sm font-medium transition"
        >
          Filtrar
        </button>
      </div>
    </form>
  );
}

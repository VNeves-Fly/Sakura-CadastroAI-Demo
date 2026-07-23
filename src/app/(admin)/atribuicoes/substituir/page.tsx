import Link from "next/link";
import { substituirAction } from "@/modules/atribuicoes/actions/substituicao.actions";
import {
  agregarExecutivos,
  agregarGestores,
  carregarCidades,
} from "@/modules/atribuicoes/utils/agregacoes.util";
import { obterHistorico } from "@/modules/atribuicoes/services/atribuicoes-store";

interface SubstituirPageProps {
  searchParams: {
    tipo?: string;
    nome?: string;
    erro?: string;
  };
}

const MENSAGENS_ERRO: Record<string, string> = {
  "informe-o-substituto": "Escolha um nome existente ou digite um nome novo pro substituto.",
  "substituto-igual-ao-atual": "O substituto não pode ser a mesma pessoa que está saindo.",
};

const selectClassName =
  "border-input bg-background text-foreground focus:border-primary focus:ring-ring/30 w-full rounded-full border px-4 py-2.5 text-sm outline-none focus:ring-2";

export default function SubstituirPage({ searchParams }: SubstituirPageProps) {
  const tipo = searchParams.tipo === "gestor" ? "gestor" : "executivo";
  const nome = searchParams.nome ?? "";
  const erro = searchParams.erro ? (MENSAGENS_ERRO[searchParams.erro] ?? searchParams.erro) : null;

  const todasCidades = carregarCidades();
  const executivos = agregarExecutivos(todasCidades);
  const gestores = agregarGestores(todasCidades);

  const resumoAtual =
    tipo === "gestor"
      ? gestores.find((item) => item.gestor === nome)
      : executivos.find((item) => item.executivo === nome);

  const opcoesDestino =
    tipo === "gestor"
      ? gestores.map((item) => item.gestor).filter((item) => item !== nome)
      : executivos.map((item) => item.executivo).filter((item) => item !== nome);

  const historico = obterHistorico().filter((item) => item.tipo === tipo);

  if (!nome || !resumoAtual) {
    return (
      <div className="flex max-w-lg flex-col gap-4">
        <p className="text-muted-foreground text-sm">
          {tipo === "gestor" ? "Gestor" : "Executivo"} não encontrado.
        </p>
        <Link href="/atribuicoes" className="text-primary text-sm font-medium hover:underline">
          Voltar pra Atribuições
        </Link>
      </div>
    );
  }

  return (
    <div className="flex max-w-lg flex-col gap-6">
      <div>
        <Link
          href="/atribuicoes"
          className="text-muted-foreground hover:text-foreground text-xs font-medium"
        >
          ← Voltar pra Atribuições
        </Link>
        <h1 className="text-foreground mt-1 text-lg font-bold">
          Substituir {tipo === "gestor" ? "gestor" : "executivo"}: {nome}
        </h1>
        <p className="text-muted-foreground text-sm">
          Todas as {resumoAtual.totalCidades} cidade(s) atendidas por{" "}
          <span className="font-medium">{nome}</span> passam a ser do substituto escolhido abaixo.
        </p>
      </div>

      <form
        action={substituirAction}
        className="border-border bg-card flex flex-col gap-4 rounded-[1.5rem] border p-6 shadow-sm"
      >
        <input type="hidden" name="tipo" value={tipo} />
        <input type="hidden" name="nomeAntigo" value={nome} />

        <div className="flex flex-col gap-1">
          <label htmlFor="nomeExistente" className="text-foreground text-sm font-medium">
            Fundir num {tipo === "gestor" ? "gestor" : "executivo"} já existente
          </label>
          <select id="nomeExistente" name="nomeExistente" className={selectClassName}>
            <option value="">— nenhum, vou digitar um nome novo —</option>
            {opcoesDestino.map((opcao) => (
              <option key={opcao} value={opcao}>
                {opcao}
              </option>
            ))}
          </select>
        </div>

        <div className="text-muted-foreground text-center text-xs font-medium tracking-wide uppercase">
          ou
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="nomeNovo" className="text-foreground text-sm font-medium">
            Nome do novo {tipo === "gestor" ? "gestor" : "executivo"}
          </label>
          <input
            id="nomeNovo"
            name="nomeNovo"
            type="text"
            placeholder="Ex.: nome do substituto contratado"
            className="border-input bg-background text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-ring/30 rounded-full border px-4 py-2.5 text-sm outline-none focus:ring-2"
          />
        </div>

        {erro ? <p className="text-destructive text-sm">{erro}</p> : null}

        <button
          type="submit"
          className="bg-primary text-primary-foreground hover:bg-sakura-600 rounded-full px-4 py-2.5 text-sm font-medium transition"
        >
          Confirmar substituição
        </button>
      </form>

      {historico.length > 0 ? (
        <div className="flex flex-col gap-2">
          <h2 className="text-foreground text-sm font-semibold">
            Histórico de substituições ({tipo === "gestor" ? "gestores" : "executivos"})
          </h2>
          <ul className="border-border bg-card flex flex-col divide-y rounded-2xl border text-sm">
            {historico.map((item, index) => (
              <li key={index} className="flex items-center justify-between gap-3 px-4 py-2.5">
                <span>
                  <span className="text-foreground font-medium">{item.nomeAntigo}</span>
                  {" → "}
                  <span className="text-foreground font-medium">{item.nomeNovo}</span>
                </span>
                <span className="text-muted-foreground text-xs whitespace-nowrap">
                  {item.totalCidadesAfetadas} cidade(s)
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

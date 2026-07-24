import type { ReactNode } from "react";
import Link from "next/link";
import { Campo, CamposGrid } from "@/modules/admin/components/dossie-campos";
import {
  carregarCidades,
  paraExecutivosView,
  paraGestoresView,
} from "@/modules/atribuicoes/utils/agregacoes.util";
import { atribuicoesAdminController } from "@/modules/atribuicoes/presentation/controllers/atribuicoes-admin.controller";
import type { AgenciaResumoPromotor } from "@/modules/cadastro/domain/repositories/agencia-repository";

interface ColaboradorPageProps {
  searchParams: {
    tipo?: string;
    nome?: string;
  };
}

function NaoEncontrado({ tipo }: { tipo: "executivo" | "gestor" }) {
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

// Mesmo banner rosa da ficha da agência (/painel/[id]) — nome em
// destaque + cargo/contato num relance, pra manter a mesma linguagem
// visual entre as duas "fichas" do admin.
function Banner({
  nome,
  tipo,
  email,
  telefone,
}: {
  nome: string;
  tipo: "executivo" | "gestor";
  email: string | null;
  telefone: string | null;
}) {
  const iniciais = nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0])
    .join("")
    .toUpperCase();

  return (
    <div className="flex flex-col gap-4 rounded-2xl bg-[#fdf1f7] p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[#72243e] text-sm font-bold text-white">
            {iniciais || "—"}
          </span>
          <div>
            <h1 className="text-xl font-bold tracking-wide text-[#72243e]">{nome}</h1>
            <span className="bg-primary/10 text-primary mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-bold uppercase">
              {tipo === "gestor" ? "Gestor" : "Executivo"}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
        <span>
          <span className="text-muted-foreground">E-mail:</span>{" "}
          <span className="text-foreground font-medium">{email ?? "—"}</span>
        </span>
        <span>
          <span className="text-muted-foreground">Telefone:</span>{" "}
          <span className="text-foreground font-medium">{telefone ?? "—"}</span>
        </span>
      </div>
    </div>
  );
}

function FichaSecao({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <div className="border-border bg-card rounded-2xl border p-5">
      <p className="text-muted-foreground mb-3 text-xs font-bold tracking-wide uppercase">
        {titulo}
      </p>
      {children}
    </div>
  );
}

// Agências atribuídas de verdade (Agencia.promotorLinkId batendo com
// algum uuid do link pessoal do promotor) — clicável, abre o dossiê da
// agência em modo leitura (?leitura=1), já que quem está vendo aqui é
// um executivo/gestor, não um analista.
function ListaAgencias({ agencias }: { agencias: AgenciaResumoPromotor[] }) {
  if (agencias.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">Nenhuma agência veio pelo link pessoal ainda.</p>
    );
  }

  return (
    <ul className="divide-border flex flex-col divide-y">
      {agencias.map((agencia) => (
        <li key={agencia.id} className="py-2 first:pt-0 last:pb-0">
          <Link
            href={`/painel/${agencia.id}?leitura=1`}
            className="flex items-center justify-between gap-2 text-sm"
          >
            <span className="text-primary font-medium hover:underline">{agencia.razaoSocial}</span>
            <span className="text-muted-foreground text-xs whitespace-nowrap">
              {agencia.status}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function AvisoSemContato() {
  return (
    <p className="text-muted-foreground mt-2 text-xs">
      Sem contato próprio cadastrado pra esse nome — só aparece como gestor de outros promotores,
      sem linha própria na planilha &quot;Links Promotores&quot;.
    </p>
  );
}

// Ficha de um colaborador (executivo ou gestor) — identidade real vem
// da tabela Promotor (planilha "Links Promotores.xlsx", todo mundo tem
// SICA), cruzada com o mock de cidades só pra estatística de bases/
// cidades atendidas. Mesma pessoa física pode ter uma ficha como
// Executivo (linha própria) e outra como Gestor (soma de quem responde
// a ela) — nunca uma ficha só "misturando" os dois cargos.
export default async function ColaboradorPage({ searchParams }: ColaboradorPageProps) {
  const tipo = searchParams.tipo === "gestor" ? "gestor" : "executivo";
  const nome = searchParams.nome ?? "";

  const [todasCidades, promotores] = await Promise.all([
    Promise.resolve(carregarCidades()),
    atribuicoesAdminController.listarPromotores(),
  ]);

  if (tipo === "gestor") {
    const resumo = paraGestoresView(promotores, todasCidades).find((item) => item.gestor === nome);
    if (!nome || !resumo) return <NaoEncontrado tipo="gestor" />;

    const subordinados = promotores.filter((promotor) => promotor.gestor === nome);
    const executivosDoGestor = subordinados
      .map((promotor) => promotor.nome)
      .sort((a, b) => a.localeCompare(b));
    const promotorGestorProprio = promotores.find((promotor) => promotor.nome === nome);
    const linksDoGestor = [
      ...(promotorGestorProprio?.linkExecutivoId ?? []),
      ...subordinados.flatMap((promotor) => promotor.linkExecutivoId),
    ];
    const agenciasDoGestor =
      await atribuicoesAdminController.listarAgenciasPorPromotor(linksDoGestor);

    return (
      <div className="flex max-w-2xl flex-col gap-6">
        <Link
          href="/atribuicoes"
          className="text-muted-foreground hover:text-foreground text-xs font-medium"
        >
          ← Voltar pra Atribuições
        </Link>
        <Banner nome={nome} tipo="gestor" email={resumo.email} telefone={resumo.telefone} />

        <FichaSecao titulo="Informações">
          <CamposGrid>
            <Campo label="Cargo">Gestor</Campo>
            <Campo label="ID SICA">{resumo.idSica ?? "—"}</Campo>
            <Campo label="Bases">{resumo.totalBases}</Campo>
          </CamposGrid>
          {!resumo.idSica && !resumo.email && !resumo.telefone ? <AvisoSemContato /> : null}
        </FichaSecao>

        <FichaSecao titulo={`Executivos que ele supervisiona (${executivosDoGestor.length})`}>
          {executivosDoGestor.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nenhum executivo vinculado.</p>
          ) : (
            <ul className="divide-border flex flex-col divide-y">
              {executivosDoGestor.map((nomeExecutivo) => (
                <li key={nomeExecutivo} className="py-2 first:pt-0 last:pb-0">
                  <Link
                    href={`/atribuicoes/colaborador?tipo=executivo&nome=${encodeURIComponent(nomeExecutivo)}`}
                    className="text-primary text-sm font-medium hover:underline"
                  >
                    {nomeExecutivo}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </FichaSecao>

        <FichaSecao titulo={`Agências (${agenciasDoGestor.length})`}>
          <ListaAgencias agencias={agenciasDoGestor} />
        </FichaSecao>
      </div>
    );
  }

  const resumo = paraExecutivosView(promotores, todasCidades).find(
    (item) => item.executivo === nome,
  );
  if (!nome || !resumo) return <NaoEncontrado tipo="executivo" />;

  const promotorAtual = promotores.find((promotor) => promotor.nome === nome);
  const agenciasDoExecutivo = await atribuicoesAdminController.listarAgenciasPorPromotor(
    promotorAtual?.linkExecutivoId ?? [],
  );

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <Link
        href="/atribuicoes"
        className="text-muted-foreground hover:text-foreground text-xs font-medium"
      >
        ← Voltar pra Atribuições
      </Link>
      <Banner nome={nome} tipo="executivo" email={resumo.email} telefone={resumo.telefone} />

      <FichaSecao titulo="Informações">
        <CamposGrid>
          <Campo label="ID SICA">{resumo.idSica ?? "—"}</Campo>
          <Campo label="Gestor">{resumo.gestor ?? "—"}</Campo>
          <Campo label="Base(s)">{resumo.base ?? "—"}</Campo>
        </CamposGrid>
        {!resumo.idSica && !resumo.email && !resumo.telefone ? <AvisoSemContato /> : null}
      </FichaSecao>

      <FichaSecao titulo={`Agências (${agenciasDoExecutivo.length})`}>
        <ListaAgencias agencias={agenciasDoExecutivo} />
      </FichaSecao>
    </div>
  );
}

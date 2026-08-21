"use client";

import type { ReactNode } from "react";
import { Building2, Calendar, Mail, MapPin, Users, FileCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatarMoedaAbreviada } from "@/modules/agencias-crm/utils/formatar-moeda.util";
import {
  extrairIniciais,
  gerarGradienteAvatar,
} from "@/modules/shared/utils/avatar-gradiente.util";
import { cn } from "@/lib/utils";
import type { AgenciaDetalheDadosDocumentacao } from "@/modules/agencias-crm/types/agencia-detalhe.types";

interface AgenciaDadosDocumentacaoTabProps {
  dados: AgenciaDetalheDadosDocumentacao;
  socioSelecionadoId: string | null;
  onSelecionarSocio: (id: string) => void;
}

function Secao({
  icon: Icon,
  titulo,
  children,
}: {
  icon: typeof Building2;
  titulo: string;
  children: ReactNode;
}) {
  return (
    <div className="border-border border-b pb-5 last:border-0">
      <h3 className="text-foreground mb-3 flex items-center gap-2 text-sm font-semibold">
        <Icon className="text-primary size-4" />
        {titulo}
      </h3>
      {children}
    </div>
  );
}

function Campo({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-muted-foreground text-[11px] font-semibold tracking-wide uppercase">
        {label}
      </span>
      <div className="text-foreground text-sm">{children}</div>
    </div>
  );
}

// Aba "Dados & Documentação" (SPEC seção 4.4) — quase tudo é dado real
// (Agencia/DadosReceita/RepresentanteLegal/CadastroComplementar), ver
// agencia-detalhe.adapter.ts pra saber exatamente o que é mock.
export function AgenciaDadosDocumentacaoTab({
  dados,
  socioSelecionadoId,
  onSelecionarSocio,
}: AgenciaDadosDocumentacaoTabProps) {
  const { empresa, datas, contato, endereco, socios } = dados;
  const socioSelecionado = socios.find((socio) => socio.id === socioSelecionadoId) ?? socios[0];

  return (
    <div className="flex flex-col gap-5">
      <Secao icon={Building2} titulo="Dados da Empresa">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Campo label="Nome Fantasia">{empresa.nomeFantasia ?? "—"}</Campo>
          <Campo label="Razão Social">{empresa.razaoSocial}</Campo>
          <Campo label="CNPJ">{empresa.cnpj}</Campo>

          <Campo label="Status">
            <span
              className={cn(
                "rounded-full px-2.5 py-0.5 text-xs font-medium",
                empresa.statusClasses,
              )}
            >
              {empresa.statusLabel}
            </span>
          </Campo>
          {empresa.etapaLabel ? (
            <Campo label="Etapa">
              <Badge variant="outline" className="capitalize">
                {empresa.etapaLabel}
              </Badge>
            </Campo>
          ) : null}
          <Campo label="Situação Receita">{empresa.situacaoReceita ?? "Não consultado"}</Campo>

          <Campo label="Data Abertura">
            {empresa.dataAbertura
              ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(
                  new Date(empresa.dataAbertura),
                )
              : "—"}
          </Campo>
          <Campo label="Tempo de CNPJ">{empresa.tempoDeCnpj ?? "—"}</Campo>
          <Campo label="Capital Social">
            {empresa.capitalSocial !== null ? formatarMoedaAbreviada(empresa.capitalSocial) : "—"}
          </Campo>

          <Campo label="Natureza Jurídica">{empresa.naturezaJuridica ?? "—"}</Campo>
          <Campo label="Porte">{empresa.porte ?? "—"}</Campo>
          <Campo label="Simples Nacional">
            {empresa.optanteSimples === null ? "—" : empresa.optanteSimples ? "Optante" : "Outros"}
          </Campo>

          <Campo label="Email Receita">{empresa.emailReceita ?? "—"}</Campo>
          <Campo label="Telefone Receita">{empresa.telefoneReceita ?? "—"}</Campo>
        </div>

        <div className="mt-4 flex flex-col gap-2">
          <Campo label="CNAE Principal">
            {empresa.cnaePrincipal ? (
              <div className="bg-muted mt-1 rounded-md px-3 py-2 font-mono text-xs">
                {empresa.cnaePrincipal.codigo}{" "}
                <span className="text-muted-foreground font-sans">
                  — {empresa.cnaePrincipal.descricao}
                </span>
              </div>
            ) : (
              "—"
            )}
          </Campo>
          {empresa.cnaesSecundarios.length > 0 ? (
            <Campo label={`CNAEs Secundários (${empresa.cnaesSecundarios.length})`}>
              <div className="mt-1 flex flex-col gap-1.5">
                {empresa.cnaesSecundarios.map((cnae) => (
                  <div
                    key={cnae.codigo}
                    className="bg-muted rounded-md px-3 py-2 font-mono text-xs"
                  >
                    {cnae.codigo}{" "}
                    <span className="text-muted-foreground font-sans">— {cnae.descricao}</span>
                  </div>
                ))}
              </div>
            </Campo>
          ) : null}
        </div>
      </Secao>

      <Secao icon={Calendar} titulo="Datas">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Campo label="Data de Cadastro">
            <span className="inline-flex items-center gap-2">
              {datas.dataCadastroLegado
                ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(
                    new Date(datas.dataCadastroLegado),
                  )
                : "—"}
              <Badge variant="outline" className="text-[10px]">
                Sistema
              </Badge>
            </span>
          </Campo>
          <Campo label="Tempo como Cliente">{datas.tempoComoCliente}</Campo>
        </div>
      </Secao>

      <Secao icon={Mail} titulo="Contato (informado no cadastro)">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Campo label="Nome">{contato.nome ?? "—"}</Campo>
          <Campo label="Email">{contato.email}</Campo>
          <Campo label="Telefone 1">
            <div className="flex flex-col gap-1">
              {contato.telefone1}
              {contato.telefone1Base ? (
                <Badge variant="outline" className="w-fit text-[10px]">
                  Base: {contato.telefone1Base}
                </Badge>
              ) : null}
            </div>
          </Campo>

          <Campo label="Telefone 2">{contato.telefone2 ?? "—"}</Campo>
          <Campo label="Telefone Comercial">{contato.telefoneComercial ?? "—"}</Campo>
          <Campo label="Email Receita">
            {contato.emailReceita ? (
              <span className="italic">
                {contato.emailReceita}{" "}
                <span className="text-muted-foreground text-xs not-italic">
                  (via Receita Federal)
                </span>
              </span>
            ) : (
              "—"
            )}
          </Campo>
        </div>
        {contato.telefoneReceita ? (
          <p className="text-muted-foreground mt-3 text-xs italic">
            Telefone Receita: {contato.telefoneReceita}{" "}
            <span className="not-italic">(via Receita Federal)</span>
          </p>
        ) : null}
      </Secao>

      <Secao icon={MapPin} titulo="Endereço">
        {endereco?.logradouro ? (
          <p className="text-foreground text-sm leading-relaxed">
            {endereco.logradouro}
            {endereco.numero ? `, ${endereco.numero}` : ""}
            {endereco.complemento ? ` — ${endereco.complemento}` : ""}
            <br />
            {endereco.bairro ? `${endereco.bairro} — ` : ""}
            {endereco.cidade}
            {endereco.uf ? `/${endereco.uf}` : ""}
            <br />
            {endereco.cep ? `CEP: ${endereco.cep}` : ""}
          </p>
        ) : (
          <p className="text-muted-foreground text-sm">Endereço não informado.</p>
        )}
      </Secao>

      <Secao icon={Users} titulo={`Sócios (${socios.length})`}>
        {socios.length === 0 ? (
          <p className="text-muted-foreground text-sm">Nenhum sócio cadastrado.</p>
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              {socios.map((socio) => (
                <button
                  key={socio.id}
                  type="button"
                  onClick={() => onSelecionarSocio(socio.id)}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap transition",
                    socio.id === socioSelecionado?.id
                      ? "bg-primary text-primary-foreground"
                      : "border-border text-muted-foreground hover:text-foreground border",
                  )}
                >
                  {socio.nome}
                </button>
              ))}
            </div>

            {socioSelecionado ? (
              <div className="border-border bg-muted/20 mt-3 flex flex-col gap-3 rounded-xl border p-4">
                <div className="flex items-center gap-3">
                  <span
                    className="flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                    style={{ background: gerarGradienteAvatar(socioSelecionado.id) }}
                  >
                    {extrairIniciais(socioSelecionado.nome)}
                  </span>
                  <div>
                    <p className="text-foreground text-sm font-semibold">{socioSelecionado.nome}</p>
                    <p className="text-muted-foreground text-xs">
                      {socioSelecionado.participacaoPct}% {socioSelecionado.papel}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <Campo label="CPF">{socioSelecionado.cpf ?? "—"}</Campo>
                  <Campo label="RG">{socioSelecionado.rg ?? "—"}</Campo>
                  <Campo label="E-mail">{socioSelecionado.email ?? "—"}</Campo>
                  <Campo label="WhatsApp">{socioSelecionado.telefone ?? "—"}</Campo>
                </div>

                <p className="text-muted-foreground flex items-center gap-1.5 text-xs italic">
                  <FileCheck className="size-3.5 shrink-0" />
                  {socioSelecionado.temRg || socioSelecionado.temProcuracao
                    ? [
                        socioSelecionado.temRg ? "RG enviado" : null,
                        socioSelecionado.temProcuracao ? "Procuração enviada" : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")
                    : "Nenhum documento enviado para este sócio."}
                </p>
              </div>
            ) : null}
          </>
        )}
      </Secao>
    </div>
  );
}

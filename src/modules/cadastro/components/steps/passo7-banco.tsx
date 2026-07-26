"use client";

import { Lock } from "lucide-react";
import {
  BANCO_PAIS_OPCOES,
  TIPO_CONTA_OPCOES,
} from "@/modules/cadastro/types/endereco-banco.types";
import type { Banco } from "@/modules/cadastro/types/endereco-banco.types";
import type {
  useCadastroWizardViewModel,
  ExecutivoOption,
  AssociacaoOption,
} from "@/modules/cadastro/view-models/use-cadastro-wizard.view-model";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Combobox,
  ComboboxInputGroup,
  ComboboxInput,
  ComboboxContent,
  ComboboxItem,
} from "@/components/ui/combobox";

type Passo7BancoProps = ReturnType<typeof useCadastroWizardViewModel>;

const INPUT_CLASSNAME =
  "rounded-full border border-input bg-background px-4 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50";

export function Passo7Banco({
  enderecoBanco,
  bancos,
  bancosCarregando,
  updateEnderecoBanco,
  executivos,
  associacoes,
  executivoIdSelecionado,
  associacaoIdSelecionado,
  executivoTravado,
  associacaoTravado,
  setExecutivoId,
  setAssociacaoId,
}: Passo7BancoProps) {
  const bancoInternacional = enderecoBanco.bancoPais === "internacional";
  const bancoSelecionado =
    bancos.find((banco) => banco.codigo === enderecoBanco.bancoCodigo) ?? null;
  const tipoContaItems: Record<string, string> = Object.fromEntries(
    TIPO_CONTA_OPCOES.map((opcao) => [opcao.valor, opcao.label]),
  );
  const executivoSelecionado =
    executivos.find((item) => item.id === executivoIdSelecionado) ?? null;
  const associacaoSelecionada =
    associacoes.find((item) => item.id === associacaoIdSelecionado) ?? null;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-foreground text-sm font-bold">País do banco</span>
        <div className="flex gap-1">
          {BANCO_PAIS_OPCOES.map((opcao) => (
            <button
              key={opcao.valor}
              type="button"
              onClick={() => updateEnderecoBanco({ bancoPais: opcao.valor })}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                enderecoBanco.bancoPais === opcao.valor
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-input text-foreground hover:bg-accent"
              }`}
            >
              {opcao.bandeira} {opcao.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-foreground text-sm font-bold">
          Banco<span className="text-destructive"> *</span>
        </label>
        {bancoInternacional ? (
          <input
            type="text"
            autoComplete="off"
            value={enderecoBanco.bancoNome}
            onChange={(event) => updateEnderecoBanco({ bancoNome: event.target.value })}
            className={INPUT_CLASSNAME}
            placeholder="Nome do banco"
          />
        ) : (
          <Combobox<Banco>
            items={bancos}
            value={bancoSelecionado}
            onValueChange={(banco) =>
              updateEnderecoBanco({
                bancoCodigo: banco?.codigo ?? "",
                bancoNome: banco?.nome ?? "",
              })
            }
            itemToStringLabel={(banco) => `${banco.codigo} - ${banco.nome}`}
          >
            <ComboboxInputGroup>
              <ComboboxInput
                placeholder={
                  bancosCarregando ? "Carregando bancos..." : "Busque por nome ou código"
                }
                disabled={bancosCarregando}
                autoComplete="off"
              />
            </ComboboxInputGroup>
            <ComboboxContent>
              {(banco: Banco) => (
                <ComboboxItem key={banco.codigo} value={banco}>
                  {banco.codigo} - {banco.nome}
                </ComboboxItem>
              )}
            </ComboboxContent>
          </Combobox>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="flex flex-col gap-1">
          <label className="text-foreground text-sm font-medium">
            {bancoInternacional ? "Routing / Branch Code" : "Agência"}
            <span className="text-destructive"> *</span>
          </label>
          <input
            type="text"
            autoComplete="off"
            value={enderecoBanco.bancoAgencia}
            onChange={(event) => updateEnderecoBanco({ bancoAgencia: event.target.value })}
            className={INPUT_CLASSNAME}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-foreground text-sm font-medium">
            {bancoInternacional ? "Conta / IBAN" : "Conta (com dígito)"}
            <span className="text-destructive"> *</span>
          </label>
          <input
            type="text"
            autoComplete="off"
            value={enderecoBanco.bancoConta}
            onChange={(event) => updateEnderecoBanco({ bancoConta: event.target.value })}
            className={INPUT_CLASSNAME}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-foreground text-sm font-medium">
            Tipo de Conta<span className="text-destructive"> *</span>
          </label>
          <Select
            items={tipoContaItems}
            value={enderecoBanco.tipoConta}
            onValueChange={(valor) => updateEnderecoBanco({ tipoConta: valor ?? "" })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {TIPO_CONTA_OPCOES.map((opcao) => (
                <SelectItem key={opcao.valor} value={opcao.valor}>
                  {opcao.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {bancoInternacional ? (
        <div className="flex flex-col gap-1">
          <label className="text-foreground text-sm font-medium">
            SWIFT / BIC<span className="text-destructive"> *</span>
          </label>
          <input
            type="text"
            autoComplete="off"
            value={enderecoBanco.bancoSwift}
            onChange={(event) =>
              updateEnderecoBanco({ bancoSwift: event.target.value.toUpperCase() })
            }
            className={INPUT_CLASSNAME}
            placeholder="Ex: BOFAUS3N"
          />
        </div>
      ) : null}

      <label className="text-foreground flex items-center gap-2 text-sm font-medium">
        <input
          type="checkbox"
          checked={enderecoBanco.favorecidoEhEmpresa}
          onChange={(event) => updateEnderecoBanco({ favorecidoEhEmpresa: event.target.checked })}
        />
        Favorecido é a própria empresa (CNPJ da agência)
      </label>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label className="text-foreground text-sm font-medium">
            Nome do Favorecido<span className="text-destructive"> *</span>
          </label>
          <input
            type="text"
            autoComplete="off"
            value={enderecoBanco.favorecidoNome}
            disabled={enderecoBanco.favorecidoEhEmpresa}
            onChange={(event) => updateEnderecoBanco({ favorecidoNome: event.target.value })}
            className={INPUT_CLASSNAME}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-foreground text-sm font-medium">
            CPF/CNPJ do Favorecido<span className="text-destructive"> *</span>
          </label>
          <input
            type="text"
            autoComplete="off"
            value={enderecoBanco.favorecidoDoc}
            disabled={enderecoBanco.favorecidoEhEmpresa}
            onChange={(event) => updateEnderecoBanco({ favorecidoDoc: event.target.value })}
            className={INPUT_CLASSNAME}
          />
        </div>
      </div>

      <div className="border-border bg-card flex flex-col gap-3 rounded-2xl border p-4">
        <span className="text-muted-foreground text-xs font-bold tracking-wide uppercase">
          Executivo e Associação
        </span>

        <div className="flex flex-col gap-1">
          <label className="text-foreground text-sm font-bold">Executivo</label>
          {executivoTravado ? (
            <div className="border-input bg-muted text-muted-foreground flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm">
              <Lock className="size-4 shrink-0" />
              {executivoSelecionado?.nome ?? "Executivo do link"}
            </div>
          ) : (
            <Combobox<ExecutivoOption>
              items={executivos}
              value={executivoSelecionado}
              onValueChange={(executivo) => setExecutivoId(executivo?.id ?? null)}
              itemToStringLabel={(executivo) => executivo.nome}
            >
              <ComboboxInputGroup>
                <ComboboxInput placeholder="Busque por nome (opcional)" autoComplete="off" />
              </ComboboxInputGroup>
              <ComboboxContent>
                {(executivo: ExecutivoOption) => (
                  <ComboboxItem key={executivo.id} value={executivo}>
                    {executivo.nome}
                  </ComboboxItem>
                )}
              </ComboboxContent>
            </Combobox>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-foreground text-sm font-bold">Associação</label>
          {associacaoTravado ? (
            <div className="border-input bg-muted text-muted-foreground flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm">
              <Lock className="size-4 shrink-0" />
              {associacaoSelecionada?.nome ?? "Associação do link"}
            </div>
          ) : (
            <Combobox<AssociacaoOption>
              items={associacoes}
              value={associacaoSelecionada}
              onValueChange={(associacao) => setAssociacaoId(associacao?.id ?? null)}
              itemToStringLabel={(associacao) => associacao.nome}
            >
              <ComboboxInputGroup>
                <ComboboxInput placeholder="Busque por nome (opcional)" autoComplete="off" />
              </ComboboxInputGroup>
              <ComboboxContent>
                {(associacao: AssociacaoOption) => (
                  <ComboboxItem key={associacao.id} value={associacao}>
                    {associacao.nome}
                  </ComboboxItem>
                )}
              </ComboboxContent>
            </Combobox>
          )}
        </div>
      </div>
    </div>
  );
}

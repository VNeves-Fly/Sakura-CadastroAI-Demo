"use client";

import {
  BANCOS_BRASILEIROS,
  BANCO_PAIS_OPCOES,
  TIPO_CONTA_OPCOES,
} from "@/modules/cadastro/types/endereco-banco.types";
import type { useCadastroWizardViewModel } from "@/modules/cadastro/view-models/use-cadastro-wizard.view-model";

type Passo6EnderecoBancoProps = ReturnType<typeof useCadastroWizardViewModel>;

const INPUT_CLASSNAME =
  "rounded-full border border-input bg-background px-4 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50";

function pillClasses(ativo: boolean): string {
  return `rounded-full border px-5 py-2 text-sm font-medium transition ${
    ativo
      ? "border-primary bg-primary text-primary-foreground"
      : "border-input text-foreground hover:bg-accent"
  }`;
}

export function Passo6EnderecoBanco({
  socios,
  enderecoBanco,
  enderecoBancoCepBuscando,
  updateEnderecoBanco,
  buscarCepEnderecoBanco,
}: Passo6EnderecoBancoProps) {
  const enderecoManual = enderecoBanco.enderecoMesmoSocio !== true;
  const socioVinculado =
    enderecoBanco.socioEnderecoVinculado !== null
      ? (socios[enderecoBanco.socioEnderecoVinculado] ?? null)
      : null;
  const bancoInternacional = enderecoBanco.bancoPais === "internacional";

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <label className="text-sm font-bold text-foreground">
          Endereço da agência é o mesmo de um sócio?
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => updateEnderecoBanco({ enderecoMesmoSocio: true })}
            className={pillClasses(enderecoBanco.enderecoMesmoSocio === true)}
          >
            Sim
          </button>
          <button
            type="button"
            onClick={() => updateEnderecoBanco({ enderecoMesmoSocio: false })}
            className={pillClasses(enderecoBanco.enderecoMesmoSocio === false)}
          >
            Não
          </button>
        </div>

        {enderecoBanco.enderecoMesmoSocio && socios.length > 1 ? (
          <select
            value={enderecoBanco.socioEnderecoVinculado ?? ""}
            onChange={(event) =>
              updateEnderecoBanco({ socioEnderecoVinculado: Number(event.target.value) })
            }
            className={INPUT_CLASSNAME}
          >
            <option value="" disabled>
              Selecione o sócio
            </option>
            {socios.map((socio, index) => (
              <option key={index} value={index}>
                {socio.nome || `Sócio ${index + 1}`}
              </option>
            ))}
          </select>
        ) : null}

        {enderecoBanco.enderecoMesmoSocio && socioVinculado ? (
          <div className="rounded-xl border border-border bg-muted px-4 py-2.5 text-sm text-foreground">
            {socioVinculado.logradouro
              ? `${socioVinculado.logradouro}, ${socioVinculado.numero || "s/n"} — ${socioVinculado.bairro}, ${socioVinculado.cidade}/${socioVinculado.uf}`
              : "Preencha o endereço do sócio na Seção Sócios pra usar aqui."}
          </div>
        ) : null}
      </div>

      {enderecoManual ? (
        <>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-bold text-foreground">CEP</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={enderecoBanco.cep}
                onChange={(event) => updateEnderecoBanco({ cep: event.target.value })}
                className={`${INPUT_CLASSNAME} min-w-0 flex-1`}
                placeholder="00000-000"
              />
              <button
                type="button"
                onClick={buscarCepEnderecoBanco}
                disabled={enderecoBancoCepBuscando}
                className="shrink-0 rounded-full border border-input px-4 py-2 text-sm font-medium text-foreground transition hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
              >
                {enderecoBancoCepBuscando ? "Buscando..." : "Buscar"}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-bold text-foreground">
              Logradouro<span className="text-destructive"> *</span>
            </label>
            <input
              type="text"
              value={enderecoBanco.logradouro}
              onChange={(event) => updateEnderecoBanco({ logradouro: event.target.value })}
              className={INPUT_CLASSNAME}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-foreground">Número</label>
              <input
                type="text"
                value={enderecoBanco.numero}
                onChange={(event) => updateEnderecoBanco({ numero: event.target.value })}
                className={INPUT_CLASSNAME}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-foreground">Complemento</label>
              <input
                type="text"
                value={enderecoBanco.complemento}
                onChange={(event) => updateEnderecoBanco({ complemento: event.target.value })}
                className={INPUT_CLASSNAME}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-foreground">Bairro</label>
              <input
                type="text"
                value={enderecoBanco.bairro}
                onChange={(event) => updateEnderecoBanco({ bairro: event.target.value })}
                className={INPUT_CLASSNAME}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="flex flex-col gap-1 sm:col-span-2">
              <label className="text-sm font-medium text-foreground">
                Cidade<span className="text-destructive"> *</span>
              </label>
              <input
                type="text"
                value={enderecoBanco.cidade}
                onChange={(event) => updateEnderecoBanco({ cidade: event.target.value })}
                className={INPUT_CLASSNAME}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-foreground">
                UF<span className="text-destructive"> *</span>
              </label>
              <input
                type="text"
                maxLength={2}
                value={enderecoBanco.uf}
                onChange={(event) => updateEnderecoBanco({ uf: event.target.value.toUpperCase() })}
                className={INPUT_CLASSNAME}
              />
            </div>
          </div>
        </>
      ) : null}

      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            Dados Bancários
          </span>
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
          <label className="text-sm font-bold text-foreground">
            Banco<span className="text-destructive"> *</span>
          </label>
          {bancoInternacional ? (
            <input
              type="text"
              value={enderecoBanco.bancoNome}
              onChange={(event) => updateEnderecoBanco({ bancoNome: event.target.value })}
              className={INPUT_CLASSNAME}
              placeholder="Nome do banco"
            />
          ) : (
            <select
              value={enderecoBanco.bancoNome}
              onChange={(event) => updateEnderecoBanco({ bancoNome: event.target.value })}
              className={INPUT_CLASSNAME}
            >
              <option value="" disabled>
                Selecione o banco
              </option>
              {BANCOS_BRASILEIROS.map((banco) => (
                <option key={banco} value={banco}>
                  {banco}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-foreground">
              {bancoInternacional ? "Routing / Branch Code" : "Agência"}
              <span className="text-destructive"> *</span>
            </label>
            <input
              type="text"
              value={enderecoBanco.bancoAgencia}
              onChange={(event) => updateEnderecoBanco({ bancoAgencia: event.target.value })}
              className={INPUT_CLASSNAME}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-foreground">
              {bancoInternacional ? "Conta / IBAN" : "Conta (com dígito)"}
              <span className="text-destructive"> *</span>
            </label>
            <input
              type="text"
              value={enderecoBanco.bancoConta}
              onChange={(event) => updateEnderecoBanco({ bancoConta: event.target.value })}
              className={INPUT_CLASSNAME}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-foreground">
              Tipo de Conta<span className="text-destructive"> *</span>
            </label>
            <select
              value={enderecoBanco.tipoConta}
              onChange={(event) => updateEnderecoBanco({ tipoConta: event.target.value })}
              className={INPUT_CLASSNAME}
            >
              <option value="" disabled>
                Selecione
              </option>
              {TIPO_CONTA_OPCOES.map((opcao) => (
                <option key={opcao.valor} value={opcao.valor}>
                  {opcao.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {bancoInternacional ? (
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-foreground">
              SWIFT / BIC<span className="text-destructive"> *</span>
            </label>
            <input
              type="text"
              value={enderecoBanco.bancoSwift}
              onChange={(event) =>
                updateEnderecoBanco({ bancoSwift: event.target.value.toUpperCase() })
              }
              className={INPUT_CLASSNAME}
              placeholder="Ex: BOFAUS3N"
            />
          </div>
        ) : null}

        <label className="flex items-center gap-2 text-sm font-medium text-foreground">
          <input
            type="checkbox"
            checked={enderecoBanco.favorecidoEhEmpresa}
            onChange={(event) => updateEnderecoBanco({ favorecidoEhEmpresa: event.target.checked })}
          />
          Favorecido é a própria empresa (CNPJ da agência)
        </label>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-foreground">
              Nome do Favorecido<span className="text-destructive"> *</span>
            </label>
            <input
              type="text"
              value={enderecoBanco.favorecidoNome}
              disabled={enderecoBanco.favorecidoEhEmpresa}
              onChange={(event) => updateEnderecoBanco({ favorecidoNome: event.target.value })}
              className={INPUT_CLASSNAME}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-foreground">
              CPF/CNPJ do Favorecido<span className="text-destructive"> *</span>
            </label>
            <input
              type="text"
              value={enderecoBanco.favorecidoDoc}
              disabled={enderecoBanco.favorecidoEhEmpresa}
              onChange={(event) => updateEnderecoBanco({ favorecidoDoc: event.target.value })}
              className={INPUT_CLASSNAME}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

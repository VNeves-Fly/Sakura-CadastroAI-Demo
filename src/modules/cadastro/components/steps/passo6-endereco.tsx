"use client";

import type { useCadastroWizardViewModel } from "@/modules/cadastro/view-models/use-cadastro-wizard.view-model";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

type Passo6EnderecoProps = ReturnType<typeof useCadastroWizardViewModel>;

const INPUT_CLASSNAME =
  "rounded-full border border-input bg-background px-4 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50";

function pillClasses(ativo: boolean): string {
  return `rounded-full border px-5 py-2 text-sm font-medium transition ${
    ativo
      ? "border-primary bg-primary text-primary-foreground"
      : "border-input text-foreground hover:bg-accent"
  }`;
}

export function Passo6Endereco({
  socios,
  enderecoBanco,
  enderecoBancoCepBuscando,
  updateEnderecoBanco,
  buscarCepEnderecoBanco,
}: Passo6EnderecoProps) {
  const enderecoManual = enderecoBanco.enderecoMesmoSocio !== true;
  const socioVinculado =
    enderecoBanco.socioEnderecoVinculado !== null
      ? (socios[enderecoBanco.socioEnderecoVinculado] ?? null)
      : null;
  // items do Select — sem isso, `<Select.Value>` mostra o índice bruto
  // ("0") em vez do nome do sócio.
  const sociosItems: Record<string, string> = Object.fromEntries(
    socios.map((socio, index) => [index.toString(), socio.nome || `Sócio ${index + 1}`]),
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <label className="text-foreground text-sm font-bold">
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
          <Select
            items={sociosItems}
            value={enderecoBanco.socioEnderecoVinculado?.toString() ?? ""}
            onValueChange={(valor) =>
              updateEnderecoBanco({ socioEnderecoVinculado: valor ? Number(valor) : null })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o sócio" />
            </SelectTrigger>
            <SelectContent>
              {socios.map((socio, index) => (
                <SelectItem key={index} value={index.toString()}>
                  {socio.nome || `Sócio ${index + 1}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}

        {enderecoBanco.enderecoMesmoSocio && socioVinculado ? (
          <div className="border-border bg-muted text-foreground rounded-xl border px-4 py-2.5 text-sm">
            {socioVinculado.logradouro
              ? `${socioVinculado.logradouro}, ${socioVinculado.numero || "s/n"} — ${socioVinculado.bairro}, ${socioVinculado.cidade}/${socioVinculado.uf}`
              : "Preencha o endereço do sócio na Seção Sócios pra usar aqui."}
          </div>
        ) : null}
      </div>

      {enderecoManual ? (
        <>
          <div className="flex flex-col gap-1">
            <label className="text-foreground text-sm font-bold">
              CEP<span className="text-destructive"> *</span>
            </label>
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
                className="border-input text-foreground hover:bg-accent shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50"
              >
                {enderecoBancoCepBuscando ? "Buscando..." : "Buscar"}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-foreground text-sm font-bold">
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
              <label className="text-foreground text-sm font-medium">
                Número<span className="text-destructive"> *</span>
              </label>
              <input
                type="text"
                value={enderecoBanco.numero}
                onChange={(event) => updateEnderecoBanco({ numero: event.target.value })}
                className={INPUT_CLASSNAME}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-foreground text-sm font-medium">Complemento</label>
              <input
                type="text"
                value={enderecoBanco.complemento}
                onChange={(event) => updateEnderecoBanco({ complemento: event.target.value })}
                className={INPUT_CLASSNAME}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-foreground text-sm font-medium">
                Bairro<span className="text-destructive"> *</span>
              </label>
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
              <label className="text-foreground text-sm font-medium">
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
              <label className="text-foreground text-sm font-medium">
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
    </div>
  );
}

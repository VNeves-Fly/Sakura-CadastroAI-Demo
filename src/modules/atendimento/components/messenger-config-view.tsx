"use client";

import { useEffect, useState } from "react";
import { Webhook, Plus, ShieldCheck, ShieldAlert } from "lucide-react";
import { SecaoColapsavel } from "@/modules/admin/components/secao-colapsavel";
import { useMessengerConfig } from "@/modules/atendimento/view-models/use-messenger-config.view-model";
import type {
  CategoriaTemplate,
  StatusTemplate,
} from "@/modules/atendimento/types/atendimento.types";

const CATEGORIAS: { valor: CategoriaTemplate; label: string }[] = [
  { valor: "UTILITY", label: "Utilidade" },
  { valor: "MARKETING", label: "Marketing" },
  { valor: "AUTHENTICATION", label: "Autenticação" },
];

const IDIOMAS = [
  { valor: "pt_BR", label: "Português (Brasil)" },
  { valor: "en_US", label: "Inglês (EUA)" },
  { valor: "es_ES", label: "Espanhol" },
];

const LABEL_STATUS_TEMPLATE: Record<StatusTemplate, string> = {
  aprovado: "Aprovado",
  pendente_aprovacao: "Pendente de aprovação",
  rejeitado: "Rejeitado",
};

const CLASSES_STATUS_TEMPLATE: Record<StatusTemplate, string> = {
  aprovado: "bg-success-bg text-success-text",
  pendente_aprovacao: "bg-warning-bg text-warning-text",
  rejeitado: "bg-destructive-bg text-destructive-text",
};

const INPUT =
  "border-input bg-background text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-ring/30 w-full rounded-full border px-4 py-2 text-sm outline-none focus:ring-2";

interface FormConexao {
  appId: string;
  appSecret: string;
  whatsappBusinessAccountId: string;
  phoneNumberId: string;
  numeroTelefoneExibicao: string;
  accessToken: string;
  webhookVerifyToken: string;
}

const FORM_VAZIO: FormConexao = {
  appId: "",
  appSecret: "",
  whatsappBusinessAccountId: "",
  phoneNumberId: "",
  numeroTelefoneExibicao: "",
  accessToken: "",
  webhookVerifyToken: "",
};

export function MessengerConfigView({ analistaAtual }: { analistaAtual: string }) {
  const {
    configuracao,
    templates,
    isLoading,
    isSalvando,
    isCriandoTemplate,
    salvarConfiguracao,
    criarTemplate,
  } = useMessengerConfig(analistaAtual);

  const [form, setForm] = useState<FormConexao>(FORM_VAZIO);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [criandoTemplate, setCriandoTemplate] = useState(false);
  const [novoTemplate, setNovoTemplate] = useState({
    nome: "",
    categoria: "UTILITY" as CategoriaTemplate,
    idioma: "pt_BR",
    conteudo: "",
  });

  // Segredos nunca voltam em texto puro do "back" (ver
  // ConfiguracaoWhatsappBusiness) — só os campos não sensíveis são
  // pré-preenchidos ao carregar; App Secret/Access Token sempre
  // começam em branco, o analista só reescreve se for trocar.
  useEffect(() => {
    if (!configuracao) return;
    setForm((atual) => ({
      ...atual,
      appId: configuracao.appId,
      whatsappBusinessAccountId: configuracao.whatsappBusinessAccountId,
      phoneNumberId: configuracao.phoneNumberId,
      numeroTelefoneExibicao: configuracao.numeroTelefoneExibicao,
      webhookVerifyToken: configuracao.webhookVerifyToken,
    }));
  }, [configuracao]);

  // Calculado só depois de montar (client-only) — evita mismatch de
  // hidratação entre server (sem window) e client (origin completo),
  // mesmo motivo documentado em revisao-documentos.tsx.
  useEffect(() => {
    setWebhookUrl(`${window.location.origin}/api/atendimento/webhook`);
  }, []);

  if (isLoading || !configuracao) {
    return <p className="text-muted-foreground text-sm">Carregando configuração...</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <SecaoColapsavel
        titulo="Conexão — Meta for Developers"
        icon={<Webhook className="size-4" />}
        defaultAberta
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span
              className={`flex w-fit items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold uppercase ${
                configuracao.conectado
                  ? "bg-success-bg text-success-text"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {configuracao.conectado ? (
                <ShieldCheck className="size-3.5" />
              ) : (
                <ShieldAlert className="size-3.5" />
              )}
              {configuracao.conectado ? "Conectado" : "Não conectado"}
            </span>
            {configuracao.salvoPor ? (
              <span className="text-muted-foreground text-xs">
                Última alteração por{" "}
                <strong className="text-foreground">{configuracao.salvoPor}</strong>
              </span>
            ) : null}
          </div>

          <div className="border-border bg-muted/40 text-muted-foreground rounded-xl border border-dashed px-4 py-3 text-xs">
            <strong className="text-foreground">Sem integração real ainda:</strong> estes campos
            existem pra o back-end preencher quando a integração de verdade com a API do WhatsApp
            Business (Meta) for feita — nada aqui é enviado pra Meta ainda, e segredos (App Secret,
            Access Token) nunca voltam em texto puro depois de salvos.
          </div>

          <form
            className="grid grid-cols-1 gap-4 sm:grid-cols-2"
            onSubmit={(event) => {
              event.preventDefault();
              void salvarConfiguracao(form);
            }}
          >
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-bold tracking-wide text-neutral-500 uppercase">
                App ID
              </span>
              <input
                value={form.appId}
                onChange={(event) => setForm({ ...form, appId: event.target.value })}
                placeholder="000000000000000"
                className={INPUT}
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-bold tracking-wide text-neutral-500 uppercase">
                App Secret
              </span>
              <input
                type="password"
                value={form.appSecret}
                onChange={(event) => setForm({ ...form, appSecret: event.target.value })}
                placeholder={configuracao.appSecretConfigurado ? "•••••••• (já configurado)" : ""}
                className={INPUT}
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-bold tracking-wide text-neutral-500 uppercase">
                WhatsApp Business Account ID
              </span>
              <input
                value={form.whatsappBusinessAccountId}
                onChange={(event) =>
                  setForm({ ...form, whatsappBusinessAccountId: event.target.value })
                }
                placeholder="000000000000000"
                className={INPUT}
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-bold tracking-wide text-neutral-500 uppercase">
                Phone Number ID
              </span>
              <input
                value={form.phoneNumberId}
                onChange={(event) => setForm({ ...form, phoneNumberId: event.target.value })}
                placeholder="000000000000000"
                className={INPUT}
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-bold tracking-wide text-neutral-500 uppercase">
                Número de telefone (exibição)
              </span>
              <input
                value={form.numeroTelefoneExibicao}
                onChange={(event) =>
                  setForm({ ...form, numeroTelefoneExibicao: event.target.value })
                }
                placeholder="+55 11 90000-0000"
                className={INPUT}
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-bold tracking-wide text-neutral-500 uppercase">
                Access Token
              </span>
              <input
                type="password"
                value={form.accessToken}
                onChange={(event) => setForm({ ...form, accessToken: event.target.value })}
                placeholder={configuracao.accessTokenConfigurado ? "•••••••• (já configurado)" : ""}
                className={INPUT}
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-bold tracking-wide text-neutral-500 uppercase">
                Webhook Verify Token
              </span>
              <input
                value={form.webhookVerifyToken}
                onChange={(event) => setForm({ ...form, webhookVerifyToken: event.target.value })}
                placeholder="token-de-verificacao"
                className={INPUT}
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-bold tracking-wide text-neutral-500 uppercase">
                Webhook Callback URL
              </span>
              <input
                readOnly
                value={webhookUrl || "carregando..."}
                className={`${INPUT} text-muted-foreground bg-muted/40`}
              />
            </label>

            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={isSalvando}
                className="bg-primary text-primary-foreground hover:bg-sakura-600 rounded-full px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSalvando ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </form>
        </div>
      </SecaoColapsavel>

      <SecaoColapsavel
        titulo="Templates de mensagem"
        icon={<Plus className="size-4" />}
        defaultAberta
      >
        <div className="flex flex-col gap-3">
          <div className="border-border bg-muted/40 text-muted-foreground rounded-xl border border-dashed px-4 py-3 text-xs">
            Templates são revisados e aprovados pela própria Meta (leva de minutos a alguns dias) —
            aqui só é possível criar e enviar pra aprovação; o status real (aprovado/rejeitado) só
            atualiza quando a integração de verdade existir.
          </div>

          <div className="flex flex-col gap-2">
            {templates.length === 0 ? (
              <p className="text-muted-foreground text-sm">Nenhum template criado ainda.</p>
            ) : (
              templates.map((template) => (
                <div
                  key={template.id}
                  className="border-border bg-muted/30 flex flex-col gap-1.5 rounded-xl border px-4 py-3 text-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-foreground font-mono font-semibold">{template.nome}</span>
                    <div className="flex items-center gap-2">
                      <span className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-[10px] font-bold uppercase">
                        {template.categoria}
                      </span>
                      <span className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-[10px] font-bold uppercase">
                        {template.idioma}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-bold uppercase ${CLASSES_STATUS_TEMPLATE[template.status]}`}
                      >
                        {LABEL_STATUS_TEMPLATE[template.status]}
                      </span>
                    </div>
                  </div>
                  <p className="text-muted-foreground">{template.conteudo}</p>
                  {template.status === "rejeitado" && template.motivoRejeicao ? (
                    <p className="text-destructive text-xs">Motivo: {template.motivoRejeicao}</p>
                  ) : null}
                </div>
              ))
            )}
          </div>

          {criandoTemplate ? (
            <form
              className="border-border flex flex-col gap-3 rounded-xl border p-4"
              onSubmit={async (event) => {
                event.preventDefault();
                if (!novoTemplate.nome.trim() || !novoTemplate.conteudo.trim()) return;
                await criarTemplate({
                  nome: novoTemplate.nome.trim(),
                  categoria: novoTemplate.categoria,
                  idioma: novoTemplate.idioma,
                  conteudo: novoTemplate.conteudo.trim(),
                });
                setNovoTemplate({ nome: "", categoria: "UTILITY", idioma: "pt_BR", conteudo: "" });
                setCriandoTemplate(false);
              }}
            >
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <label className="flex flex-col gap-1 sm:col-span-2">
                  <span className="text-[11px] font-bold tracking-wide text-neutral-500 uppercase">
                    Nome (snake_case)
                  </span>
                  <input
                    value={novoTemplate.nome}
                    onChange={(event) =>
                      setNovoTemplate({ ...novoTemplate, nome: event.target.value })
                    }
                    placeholder="ex: confirmacao_documento"
                    required
                    className={INPUT}
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-[11px] font-bold tracking-wide text-neutral-500 uppercase">
                    Categoria
                  </span>
                  <select
                    value={novoTemplate.categoria}
                    onChange={(event) =>
                      setNovoTemplate({
                        ...novoTemplate,
                        categoria: event.target.value as CategoriaTemplate,
                      })
                    }
                    className={INPUT}
                  >
                    {CATEGORIAS.map((categoria) => (
                      <option key={categoria.valor} value={categoria.valor}>
                        {categoria.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="flex flex-col gap-1">
                <span className="text-[11px] font-bold tracking-wide text-neutral-500 uppercase">
                  Idioma
                </span>
                <select
                  value={novoTemplate.idioma}
                  onChange={(event) =>
                    setNovoTemplate({ ...novoTemplate, idioma: event.target.value })
                  }
                  className={`${INPUT} sm:w-56`}
                >
                  {IDIOMAS.map((idioma) => (
                    <option key={idioma.valor} value={idioma.valor}>
                      {idioma.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-[11px] font-bold tracking-wide text-neutral-500 uppercase">
                  Conteúdo
                </span>
                <textarea
                  value={novoTemplate.conteudo}
                  onChange={(event) =>
                    setNovoTemplate({ ...novoTemplate, conteudo: event.target.value })
                  }
                  rows={3}
                  placeholder="Use {{1}}, {{2}}... pras variáveis, igual o padrão da Meta"
                  required
                  className="border-input bg-background text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-ring/30 w-full rounded-2xl border px-4 py-2 text-sm outline-none focus:ring-2"
                />
              </label>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isCriandoTemplate}
                  className="bg-primary text-primary-foreground hover:bg-sakura-600 rounded-full px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isCriandoTemplate ? "Enviando..." : "Enviar pra aprovação da Meta"}
                </button>
                <button
                  type="button"
                  onClick={() => setCriandoTemplate(false)}
                  className="border-input hover:bg-accent rounded-full border px-4 py-2 text-sm font-medium transition"
                >
                  Cancelar
                </button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setCriandoTemplate(true)}
              className="border-input hover:bg-accent flex w-fit items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-semibold transition"
            >
              <Plus className="size-4" />
              Criar novo template
            </button>
          )}
        </div>
      </SecaoColapsavel>
    </div>
  );
}

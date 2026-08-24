import { WHATSAPP_LINK_ATENDIMENTO } from "@/modules/shared/utils/whatsapp.util";

// Sistema visual das 4 artes de e-mail (docs/emails/, 2026-08-24) — cores
// puxadas dos tokens já usados no resto do app (não um valor novo
// inventado): PINK = sakura-500/--primary (tailwind.config.ts), NAVY =
// --foreground (globals.css, hsl(222 47% 11%)), VERDE = --success-bg
// (globals.css, hsl(145 67% 55%) — o "verde WhatsApp" das artes é esse
// tom, não o verde oficial do WhatsApp).
const COR_PINK = "#f60f9e";
const COR_NAVY = "#0f1729";
const COR_VERDE = "#3fd980";
const COR_CINZA_CLARO = "#f2f2f2";
const FONTE = "Arial, Helvetica, sans-serif";

export interface EmailBanner {
  // URL absoluta do ÍCONE EM PNG (ver iconeEmailUrl abaixo) — desenho
  // branco em fundo transparente, pensado pra ir dentro do círculo navy.
  iconeUrl: string;
  // Uma entry por linha do título (a arte sempre quebra em 1-3 linhas
  // curtas, nunca um parágrafo corrido).
  tituloLinhas: string[];
}

// SVG em <img> não renderiza em vários clientes de e-mail — confirmado ao
// vivo no Gmail, 2026-08-24 (ícone quebrado). Os SVGs de public/icons/
// (usados só aqui, em nenhuma outra tela) foram rasterizados em PNG uma
// vez (ver scratchpad/rasterizar-icones-email.ts) e versionados como
// `<nome>-email.png` ao lado do SVG original. Usar sempre esta função em
// vez de montar a URL na mão, pra não escapar de novo pro .svg.
export function iconeEmailUrl(baseUrl: string, nome: string): string {
  return `${baseUrl}/icons/${nome}-email.png`;
}

export interface EmailCta {
  label: string;
  href: string;
  cor: "pink" | "verde";
}

export interface EmailTemplateInput {
  baseUrl: string;
  // null = sem banner (Arte 4 "Cadastro não aprovado" não tem ícone nem
  // faixa rosa, só o logo e o corpo).
  banner: EmailBanner | null;
  // HTML já pronto do corpo (parágrafos, caixas etc — ver helpers abaixo).
  corpoHtml: string;
}

// Molde compartilhado das 4 artes — logo Sakura no topo, banner rosa
// opcional (ícone + título), corpo em largura fixa (bulletproof pra
// e-mail: table-based, estilo inline, sem flex/grid). `baseUrl` monta a
// URL absoluta do logo (obrigatório em e-mail — path relativo não resolve
// fora do navegador do app).
export function montarEmailSakura(input: EmailTemplateInput): string {
  const logoUrl = `${input.baseUrl}/logos/logo-sakura-oficial.png`;

  const bannerHtml = input.banner
    ? `
      <tr>
        <td style="padding:0 0 28px 0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COR_PINK};border-radius:24px;">
            <tr>
              <td style="padding:20px 24px;">
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td width="64" style="width:64px;">
                      <table role="presentation" width="64" height="64" cellpadding="0" cellspacing="0" style="background:${COR_NAVY};border-radius:50%;">
                        <tr>
                          <td align="center" valign="middle" style="width:64px;height:64px;">
                            <img src="${input.banner.iconeUrl}" width="30" alt="" style="display:block;border:0;" />
                          </td>
                        </tr>
                      </table>
                    </td>
                    <td style="padding-left:16px;">
                      <span style="color:#ffffff;font-family:${FONTE};font-size:21px;font-weight:800;line-height:1.2;">
                        ${input.banner.tituloLinhas.join("<br/>")}
                      </span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>`
    : "";

  return `
<div style="background:#f5f5f7;padding:32px 12px;font-family:${FONTE};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:0 auto;">
    <tr>
      <td align="center" style="padding-bottom:28px;">
        <img src="${logoUrl}" width="150" alt="Sakura Consolidadora" style="display:block;border:0;" />
      </td>
    </tr>
    ${bannerHtml}
    <tr>
      <td style="background:#ffffff;border-radius:24px;padding:32px 28px;">
        ${input.corpoHtml}
      </td>
    </tr>
  </table>
</div>`;
}

export function paragrafoEmail(html: string, opts: { negrito?: boolean } = {}): string {
  return `<p style="margin:0 0 16px 0;color:${COR_NAVY};font-family:${FONTE};font-size:15px;line-height:1.5;text-align:center;${opts.negrito ? "font-weight:700;" : ""}">${html}</p>`;
}

export function caixaDestaqueNavy(html: string): string {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COR_NAVY};border-radius:16px;margin:0 0 16px 0;">
      <tr>
        <td style="padding:18px 20px;color:#ffffff;font-family:${FONTE};font-size:14px;line-height:1.5;text-align:center;">
          ${html}
        </td>
      </tr>
    </table>`;
}

export function caixaCinza(html: string): string {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COR_CINZA_CLARO};border-radius:16px;margin:0 0 16px 0;">
      <tr>
        <td style="padding:20px 22px;">
          ${html}
        </td>
      </tr>
    </table>`;
}

// Lista com seta rosa (→) — o "Para assinar é muito simples" da Arte 1.
export function listaPassosEmail(passos: string[]): string {
  const itens = passos
    .map(
      (passo) => `
      <tr>
        <td width="24" valign="top" style="color:${COR_PINK};font-family:${FONTE};font-size:15px;font-weight:700;padding:0 8px 12px 0;">→</td>
        <td style="color:${COR_NAVY};font-family:${FONTE};font-size:14px;line-height:1.4;padding:0 0 12px 0;">${passo}</td>
      </tr>`,
    )
    .join("");

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${itens}</table>`;
}

export function botaoEmail(cta: EmailCta): string {
  const cor = cta.cor === "verde" ? COR_VERDE : COR_PINK;
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
      <tr>
        <td style="background:${cor};border-radius:999px;">
          <a href="${cta.href}" style="display:block;padding:14px 32px;color:#ffffff;font-family:${FONTE};font-size:15px;font-weight:700;text-decoration:none;">${cta.label}</a>
        </td>
      </tr>
    </table>`;
}

// "Ficou com alguma dúvida? [Falar no WhatsApp]" — mesmo número público de
// atendimento já usado em resultado-final.tsx (WHATSAPP_LINK_ATENDIMENTO).
export function blocoWhatsappEmail(tituloPergunta = "Ficou com alguma dúvida?"): string {
  return `
    ${paragrafoEmail(tituloPergunta, { negrito: true })}
    <div style="text-align:center;">
      ${botaoEmail({ label: "Falar no WhatsApp", href: WHATSAPP_LINK_ATENDIMENTO, cor: "verde" })}
    </div>`;
}

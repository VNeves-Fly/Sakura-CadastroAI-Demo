import type { EmailSender } from "@/modules/shared/domain/services/email-sender";
import type { DisparoEmail } from "@/modules/shared/domain/enums";
import type { ContratoSignatario } from "@/modules/cadastro/domain/services/contrato-assinatura-service";
import {
  montarEmailSakura,
  paragrafoEmail,
  caixaDestaqueNavy,
  caixaCinza,
  listaPassosEmail,
  blocoWhatsappEmail,
  iconeEmailUrl,
} from "@/modules/shared/utils/email-template.util";

// Arte 1 (docs/emails/) — "O contrato está no seu e-mail!". Só faz sentido
// quando NÃO tem gate de biometria: nesse fluxo o D4Sign manda o e-mail de
// assinatura ele mesmo (skip_email:"0", ver d4sign.adapter.ts) — este
// e-mail é só um aviso da Sakura avisando pra ficar de olho na caixa de
// entrada/spam, não substitui o do D4Sign. Best-effort, nunca lança (mesmo
// racional de iniciarVerificacoesBiometricas — o contrato já foi gerado
// nesse ponto).
export async function notificarAssinaturaSemBiometria(
  emailSender: EmailSender,
  signatarios: ContratoSignatario[],
  baseUrl: string,
  agenciaId: string,
  disparo: DisparoEmail,
): Promise<void> {
  const html = montarEmailSakura({
    baseUrl,
    banner: {
      iconeUrl: iconeEmailUrl(baseUrl, "contrato"),
      tituloLinhas: ["O CONTRATO ESTÁ", "NO SEU E-MAIL!"],
    },
    corpoHtml: `
      ${paragrafoEmail("Estamos na reta final do seu cadastro na Sakura.")}
      ${paragrafoEmail("Você receberá por e-mail o contrato para assinatura digital pela plataforma D4Sign.")}
      ${caixaDestaqueNavy(
        `Fique atento ao remetente:<br/>Cadastro - Sakura via D4Sign<br/><strong style="color:${"#f60f9e"};">sign@d4sign.com.br</strong>`,
      )}
      ${caixaCinza(
        `<p style="margin:0 0 14px 0;color:#0f1729;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:700;text-align:center;">Para assinar é muito simples:</p>` +
          listaPassosEmail([
            "Acesse o documento recebido;",
            "Confira as informações;",
            "Realize a assinatura digital;",
            "Pronto! Seguimos para a próxima etapa.",
          ]),
      )}
      ${paragrafoEmail("Não encontrou o e-mail?", { negrito: true })}
      ${paragrafoEmail("Verifique também as pastas de spam, lixo eletrônico ou promoções.")}
      ${paragrafoEmail("Após a assinatura do contrato, você receberá seus acessos em até 1 dia útil.")}
      ${blocoWhatsappEmail()}
    `,
  });

  for (const signatario of signatarios) {
    try {
      await emailSender.send({
        to: signatario.email,
        subject: "O contrato está no seu e-mail! — Sakura Consolidadora",
        html,
        meta: { origem: "assinatura-contrato", disparo, agenciaId },
      });
    } catch (error) {
      console.warn(
        `notificarAssinaturaSemBiometria: falha ao enviar pra ${signatario.email}: ${String(error)}`,
      );
    }
  }
}

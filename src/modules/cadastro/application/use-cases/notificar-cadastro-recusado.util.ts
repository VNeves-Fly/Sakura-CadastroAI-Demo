import type { EmailSender } from "@/modules/shared/domain/services/email-sender";
import {
  montarEmailSakura,
  paragrafoEmail,
  caixaCinza,
} from "@/modules/shared/utils/email-template.util";

// Arte 4 (docs/emails/) — "Cadastro não aprovado". Sem ícone/banner (a
// única das 4 artes assim) e sem CTA — só o logo e o texto de
// agradecimento/recusa, mesmo copy genérico da arte original (não
// menciona nome da agência nem motivo — decisão de design deles, não
// nossa). Best-effort, nunca lança.
export async function notificarCadastroRecusado(
  emailSender: EmailSender,
  emailContato: string,
  baseUrl: string,
  agenciaId: string,
): Promise<void> {
  const html = montarEmailSakura({
    baseUrl,
    banner: null,
    corpoHtml: `
      ${paragrafoEmail("Agradecemos o interesse da sua agência em estabelecer uma parceria com a Sakura Consolidadora!")}
      ${caixaCinza(
        `<p style="margin:0;color:#f60f9e;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:700;text-align:center;line-height:1.5;">Após a análise das informações enviadas, informamos que, neste momento, não foi possível concluir a aprovação do cadastro.</p>`,
      )}
      ${paragrafoEmail("Sabemos que toda parceria começa com uma oportunidade e, por isso, permanecemos à disposição para esclarecer eventuais dúvidas.")}
      ${paragrafoEmail("Agradecemos pela confiança e pelo interesse na Sakura e esperamos que possamos construir essa parceria em um próximo momento.")}
      ${paragrafoEmail("Atenciosamente,<br/>Time Sakura", { negrito: true })}
    `,
  });

  try {
    await emailSender.send({
      to: emailContato,
      subject: "Sobre o seu cadastro na Sakura Consolidadora",
      html,
      meta: { origem: "cadastro-recusado", disparo: "manual", agenciaId },
    });
  } catch (error) {
    console.warn(
      `notificarCadastroRecusado: falha ao enviar pra ${emailContato}: ${String(error)}`,
    );
  }
}

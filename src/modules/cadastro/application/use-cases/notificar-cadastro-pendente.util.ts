import type { EmailSender } from "@/modules/shared/domain/services/email-sender";
import {
  montarEmailSakura,
  paragrafoEmail,
  botaoEmail,
  iconeEmailUrl,
} from "@/modules/shared/utils/email-template.util";
import { WHATSAPP_LINK_ATENDIMENTO } from "@/modules/shared/utils/whatsapp.util";

// Arte 3 (docs/emails/) — "Seu cadastro está quase pronto!" — versão
// genérica, disparada quando a IA manda o cadastro pra revisão manual
// (em_complementar) por reprovação/divergência real (não falha técnica —
// ver AnalisarCadastroUseCase, só o branch "REPROVADO" chama isto, nunca
// FALHA_ANALISE/FALHA_CONTRATO, que são problema nosso, não do cliente).
// Best-effort, nunca lança — mesmo racional das outras notificações desta
// pasta.
export async function notificarCadastroPendente(
  emailSender: EmailSender,
  emailContato: string,
  baseUrl: string,
): Promise<void> {
  const html = montarEmailSakura({
    baseUrl,
    banner: {
      iconeUrl: iconeEmailUrl(baseUrl, "cadastro-andamento"),
      tituloLinhas: ["SEU CADASTRO", "ESTÁ QUASE", "PRONTO!"],
    },
    corpoHtml: `
      ${paragrafoEmail("Para concluirmos seu cadastro na Sakura, precisamos de algumas informações ou documentos.")}
      ${paragrafoEmail("Fale com a nossa equipe pelo WhatsApp para enviar o que falta e seguir para a próxima etapa.", { negrito: true })}
      <div style="text-align:center;margin:0 0 20px 0;">
        ${botaoEmail({ label: "Falar no WhatsApp", href: WHATSAPP_LINK_ATENDIMENTO, cor: "verde" })}
      </div>
      ${paragrafoEmail("Nossa equipe também poderá entrar em contato. Por isso, fique sempre atento ao seu e-mail e telefone celular.")}
      ${paragrafoEmail("Atenciosamente,<br/>Time Sakura", { negrito: true })}
    `,
  });

  try {
    await emailSender.send({
      to: emailContato,
      subject: "Seu cadastro está quase pronto! — Sakura Consolidadora",
      html,
    });
  } catch (error) {
    console.warn(
      `notificarCadastroPendente: falha ao enviar pra ${emailContato}: ${String(error)}`,
    );
  }
}

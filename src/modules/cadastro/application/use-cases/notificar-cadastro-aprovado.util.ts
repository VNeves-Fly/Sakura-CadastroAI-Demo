import type { EmailSender } from "@/modules/shared/domain/services/email-sender";
import type { UsuarioMasterRepository } from "@/modules/cadastro/domain/repositories/usuario-master-repository";
import type { PromotorRepository } from "@/modules/atribuicoes/domain/repositories/promotor-repository";
import {
  montarEmailSakura,
  paragrafoEmail,
  botaoEmail,
} from "@/modules/shared/utils/email-template.util";

const SAKURACLICK_URL = "https://www.sakuraclick.com.br";

// Assinatura da diretoria — estática (mesma dupla em toda arte 2, não é
// dado por agência), copiada literal de docs/emails/ARTE 2.
const ASSINATURA_DIRETORIA = `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:8px;">
    <tr>
      <td width="50%" style="text-align:center;color:#0f1729;font-family:Arial,Helvetica,sans-serif;font-size:13px;">
        <p style="margin:0 0 2px 0;font-style:italic;font-size:16px;">Fernando Lermi</p>
        <p style="margin:0;font-weight:700;">Diretor de vendas</p>
        <p style="margin:0;">fernando.lermi@sakuratur.com.br</p>
      </td>
      <td width="50%" style="text-align:center;color:#0f1729;font-family:Arial,Helvetica,sans-serif;font-size:13px;">
        <p style="margin:0 0 2px 0;font-style:italic;font-size:16px;">Flávio Marques</p>
        <p style="margin:0;font-weight:700;">Diretor Executivo de Vendas e Expansão</p>
        <p style="margin:0;">flavio.marques@sakuratur.com.br</p>
      </td>
    </tr>
  </table>`;

// Arte 2 (docs/emails/) — "Cadastro aprovado!". Decisão do usuário
// (2026-08-24): dispara na ATIVAÇÃO final (StatusAgencia ativo, quando
// SICA/TravelLink e Usuário Master já estão completos), não em
// aguardando_cadastramento como cogitado a princípio — é só nesse ponto
// que "Login"/"Executivo"/"Contato" existem de verdade pra preencher o
// e-mail. Não há sistema de login/senha nesta aplicação (confirmado —
// UsuarioMasterRepository não tem esses campos): "Login" aqui é o e-mail
// do Usuário Master, quem de fato vai acessar sakuraclick.com.br (o
// provisionamento em si acontece fora deste app). Best-effort, nunca
// lança — a ativação do cliente não pode ficar refém do e-mail.
export async function notificarCadastroAprovado(
  emailSender: EmailSender,
  usuarioMasterRepository: UsuarioMasterRepository,
  promotorRepository: PromotorRepository,
  agencia: { id: string; emailContato: string; executivoId: string | null },
  baseUrl: string,
): Promise<void> {
  try {
    const usuarioMaster = await usuarioMasterRepository.findByAgenciaId(agencia.id);
    const promotor = agencia.executivoId
      ? await promotorRepository.findById(agencia.executivoId)
      : null;

    const destinatario = usuarioMaster?.email ?? agencia.emailContato;

    const linhasContato = [
      `<strong>Login:</strong> ${usuarioMaster?.email ?? "a definir"}`,
      promotor ? `<strong>Executivo:</strong> ${promotor.nome}` : null,
      promotor ? `<strong>Contato:</strong> ${promotor.telefone ?? promotor.email}` : null,
    ].filter((linha): linha is string => linha !== null);

    const html = montarEmailSakura({
      baseUrl,
      banner: {
        iconeUrl: `${baseUrl}/icons/cadastro-aprovado.svg`,
        tituloLinhas: ["CADASTRO", "APROVADO!"],
      },
      corpoHtml: `
        ${paragrafoEmail("Seja muito bem-vindo à Sakura!", { negrito: true })}
        ${paragrafoEmail("Temos uma ótima notícia: <strong>seu cadastro foi aprovado</strong>.")}
        ${paragrafoEmail("A partir de agora, sua agência faz parte da nossa rede de parceiros. Construiremos uma parceria próxima, transparente e que gere novas oportunidades para o seu negócio.")}
        ${paragrafoEmail("Sua jornada com a Sakura começa agora.", { negrito: true })}
        ${paragrafoEmail("Nos próximos passos, você encontrará tudo o que precisa para acessar nossas ferramentas, conhecer nossos produtos e começar a vender.")}
        ${paragrafoEmail(`<strong>Plataforma de reservas</strong><br/>Acesse: ${SAKURACLICK_URL.replace("https://", "")}`)}
        ${paragrafoEmail(linhasContato.join("<br/>"))}
        ${paragrafoEmail("Preparamos também uma página com tudo o que você precisa para transformar oportunidades em vendas.")}
        <div style="text-align:center;margin:0 0 24px 0;">
          ${botaoEmail({ label: "Clique aqui para acessar", href: SAKURACLICK_URL, cor: "pink" })}
        </div>
        ${paragrafoEmail("Seja bem-vindo!", { negrito: true })}
        ${ASSINATURA_DIRETORIA}
      `,
    });

    await emailSender.send({
      to: destinatario,
      subject: "Cadastro aprovado! — Sakura Consolidadora",
      html,
    });
  } catch (error) {
    console.warn(
      `notificarCadastroAprovado: falha ao enviar (agenciaId=${agencia.id}): ${String(error)}`,
    );
  }
}

import {
  STATUS_AGUARDANDO_CADASTRAMENTO,
  STATUS_AGUARDANDO_VALIDACAO,
  type AgenciaRepository,
} from "@/modules/cadastro/domain/repositories/agencia-repository";
import type { ContratoSignatarioRepository } from "@/modules/cadastro/domain/repositories/contrato-signatario-repository";
import type { ContratoAssinaturaRepository } from "@/modules/cadastro/domain/repositories/contrato-assinatura-repository";
import type { BiometriaVerificacaoRepository } from "@/modules/cadastro/domain/repositories/biometria-verificacao-repository";
import {
  todosSociosAssinaram,
  todosSociosComBiometriaAprovada,
} from "@/modules/cadastro/domain/services/assinatura-socios.util";

export interface ContextoAvancoStatus {
  usuarioEmail: string | null;
  origem: string;
}

// Ponto único que decide se uma agência em aguardando_assinatura já pode
// avançar — chamado a partir de QUALQUER evento que possa ser "a última
// peça que faltava": assinatura de sócio (webhook D4Sign type_post=4/1,
// sync manual) ou biometria aprovada (webhook Legitimuz), já que com o
// gate ativo os dois podem terminar em qualquer ordem. Sem
// gateBiometriaAtivo, só depende de todos os sócios terem assinado
// (aguardando_validacao, comportamento de sempre). Com o gate ativo,
// depende de AMBOS — todos os sócios terem assinado E com a biometria
// aprovada (direto pra aguardando_cadastramento, pula
// aguardando_validacao) — decisão do usuário 2026-08-25, ver
// todosSociosComBiometriaAprovada.
export async function tentarAvancarAposAssinaturaEBiometria(
  agenciaRepository: AgenciaRepository,
  contratoSignatarioRepository: ContratoSignatarioRepository,
  contratoAssinaturaRepository: ContratoAssinaturaRepository,
  biometriaVerificacaoRepository: BiometriaVerificacaoRepository,
  agenciaId: string,
  contratoId: string,
  gateBiometriaAtivo: boolean,
  contexto: ContextoAvancoStatus,
): Promise<boolean> {
  const socios = await contratoSignatarioRepository.findByContratoId(contratoId);
  const assinaturas = await contratoAssinaturaRepository.findByContratoId(contratoId);
  const emailsSocios = socios.map((socio) => socio.email);

  const assinaram = todosSociosAssinaram(
    emailsSocios,
    assinaturas.filter((assinatura) => assinatura.assinadoEm !== null).map((a) => a.email),
  );
  if (!assinaram) return false;

  if (!gateBiometriaAtivo) {
    await agenciaRepository.atualizarStatus(agenciaId, STATUS_AGUARDANDO_VALIDACAO, contexto);
    return true;
  }

  const biometrias = await biometriaVerificacaoRepository.findByContratoId(contratoId);
  const biometriaOk = todosSociosComBiometriaAprovada(
    emailsSocios,
    biometrias.map((b) => ({ email: b.email, status: b.status })),
  );
  if (!biometriaOk) return false;

  await agenciaRepository.atualizarStatus(agenciaId, STATUS_AGUARDANDO_CADASTRAMENTO, contexto);
  return true;
}

// Variante usada só por processarDocumentoFinalizado (webhook D4Sign
// type_post=1) — esse evento em si já É a prova de que TODOS assinaram (o
// D4Sign só fecha o documento depois do último signatário), então,
// diferente de tentarAvancarAposAssinaturaEBiometria, NÃO reconsulta
// ContratoAssinatura pra reconferir isso. Isso importa de verdade: se um
// webhook "4" individual tiver se perdido no caminho, nosso
// ContratoAssinatura local pode estar desatualizado mesmo com o "1" (fonte
// da verdade) confirmando que está tudo assinado — reconferir aqui
// bloquearia o avanço incorretamente nesse cenário, que é justamente o que
// esse "alcançar" existe pra cobrir. Só falta checar biometria quando o
// gate está ativo.
export async function avancarAposDocumentoFinalizado(
  agenciaRepository: AgenciaRepository,
  contratoSignatarioRepository: ContratoSignatarioRepository,
  biometriaVerificacaoRepository: BiometriaVerificacaoRepository,
  agenciaId: string,
  contratoId: string,
  gateBiometriaAtivo: boolean,
  contexto: ContextoAvancoStatus,
): Promise<boolean> {
  if (!gateBiometriaAtivo) {
    await agenciaRepository.atualizarStatus(agenciaId, STATUS_AGUARDANDO_VALIDACAO, contexto);
    return true;
  }

  const socios = await contratoSignatarioRepository.findByContratoId(contratoId);
  const biometrias = await biometriaVerificacaoRepository.findByContratoId(contratoId);
  const biometriaOk = todosSociosComBiometriaAprovada(
    socios.map((socio) => socio.email),
    biometrias.map((b) => ({ email: b.email, status: b.status })),
  );
  if (!biometriaOk) return false;

  await agenciaRepository.atualizarStatus(agenciaId, STATUS_AGUARDANDO_CADASTRAMENTO, contexto);
  return true;
}

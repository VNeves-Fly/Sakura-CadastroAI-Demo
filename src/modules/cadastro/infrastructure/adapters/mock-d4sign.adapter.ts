import type {
  ContratoAssinaturaService,
  GerarContratoInput,
  GerarContratoResult,
} from "@/modules/cadastro/domain/services/contrato-assinatura-service";

// Sem integração real com o D4Sign (sem credencial/API disponível neste
// projeto ainda). Simula a geração + envio do contrato pra assinatura dos
// sócios, até a integração real ser conectada nesta mesma porta
// (ContratoAssinaturaService) — trocar a implementação aqui não afeta
// use-case/domain.
//
// Pendências pra trocar isto por uma integração real (D4SignService):
// 1. Credenciais: D4SIGN_API_TOKEN, D4SIGN_CRYPT_KEY e D4SIGN_SAFE_ID
//    (UUID do "Safe"/pasta onde os documentos entram) via env — hoje
//    nenhuma delas existe no projeto.
// 2. Documento: `gerarEEnviar()` não tem PDF/conteúdo nenhum pra mandar —
//    só cnpj/razaoSocial/signatarios. É preciso decidir se o contrato vem
//    de um template já existente (reaproveitar o do fluxo admin/Etapa 3,
//    ver etapas/etapa-3.md → "contrato-gerar") ou gerar um PDF novo aqui
//    a partir dos dados do cadastro, e então fazer upload desse arquivo
//    pro Safe antes de chamar o endpoint de envio pra assinatura.
// 3. Depois de ter as duas coisas acima: criar
//    `d4sign.adapter.ts` implementando `ContratoAssinaturaService` e
//    trocar a instância em `cadastro-publico.controller.ts:20`
//    (`new MockD4SignService()` → `new D4SignService()`).
export class MockD4SignService implements ContratoAssinaturaService {
  async gerarEEnviar(input: GerarContratoInput): Promise<GerarContratoResult> {
    const provedorId = `mock-d4sign-${input.cnpj}`;
    return { provedorId, status: "aguardando_assinatura" };
  }
}

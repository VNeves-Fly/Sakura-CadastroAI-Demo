"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { nextAuthOptions } from "@/modules/auth/presentation/routes/next-auth.options";
import { cadastroAdminController } from "@/modules/cadastro/presentation/controllers/cadastro-admin.controller";
import { DomainError } from "@/modules/shared/domain/errors";
import { validarArquivoUpload } from "@/modules/cadastro/utils/arquivo-upload.util";
import type { TipoDocumento } from "@/modules/cadastro/domain/enums";

// Única transição de status permitida a partir do arquivo: Reprovada ->
// Ativa (reaproveita o mesmo use-case genérico de "ativarCliente" — não
// existe o caminho inverso, Ativa não pode virar Reprovada por aqui).
export async function reativarClienteAction(agenciaId: string) {
  const session = await getServerSession(nextAuthOptions);
  const usuarioEmail = session?.user?.email ?? session?.user?.name ?? "analista não identificado";
  await cadastroAdminController.ativarCliente(agenciaId, usuarioEmail);
  revalidatePath(`/arquivo/${agenciaId}`);
  revalidatePath("/arquivo");
}

// Atualização de documentação (RG/CNH, Contrato Social, Procuração e tipos
// "extra") direto do arquivo — sem `garantirAtendimentoAssumido`: esse lock
// (ver /cadastros/[id]/actions.ts) é sobre atendimento no funil, nunca
// aberto pra uma agência já finalizada, então sempre bloquearia aqui (mesmo
// precedente de `reativarClienteAction` acima, que também não passa por
// ele). `ignorarDocumentoVigente`+`aprovarAutomaticamente`: o documento
// vigente normalmente já está APROVADO (é isso que permitiu a agência
// chegar em Ativo) — sem essas flags o InserirDocumentoManualUseCase
// bloquearia todo upload aqui (ver comentário no use-case).
export async function inserirDocumentoArquivoAction(
  agenciaId: string,
  tipo: TipoDocumento,
  representanteLegalId: string | null,
  formData: FormData,
) {
  const session = await getServerSession(nextAuthOptions);
  const arquivo = formData.get("arquivo");

  if (!(arquivo instanceof File)) {
    throw new DomainError("Selecione um arquivo pra enviar.");
  }

  const erroValidacao = validarArquivoUpload(arquivo, "Documento");
  if (erroValidacao) {
    throw new DomainError(erroValidacao);
  }

  const buffer = Buffer.from(await arquivo.arrayBuffer());
  const descricaoOutro = String(formData.get("descricaoOutro") ?? "").trim();

  await cadastroAdminController.inserirDocumentoManual({
    agenciaId,
    representanteLegalId,
    tipo,
    descricaoOutro: tipo === "OUTROS" && descricaoOutro ? descricaoOutro : null,
    arquivo: { buffer, originalName: arquivo.name, mimeType: arquivo.type },
    inseridoPor: session?.user?.email ?? session?.user?.name ?? "analista não identificado",
    ignorarDocumentoVigente: true,
    aprovarAutomaticamente: true,
  });
  revalidatePath(`/arquivo/${agenciaId}`);
}

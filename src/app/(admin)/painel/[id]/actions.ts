"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { nextAuthOptions } from "@/modules/auth/presentation/routes/next-auth.options";
import { cadastroAdminController } from "@/modules/cadastro/presentation/controllers/cadastro-admin.controller";

// Server Actions do dossiê — cada uma só dispara a ação no controller e
// revalida a própria página do dossiê (sem redirect: o form re-renderiza
// no mesmo lugar já com o novo status).
export async function aprovarComplementarAction(id: string) {
  await cadastroAdminController.aprovarComplementar(id);
  revalidatePath(`/painel/${id}`);
}

export async function marcarContratoAssinadoAction(id: string) {
  await cadastroAdminController.marcarContratoAssinado(id);
  revalidatePath(`/painel/${id}`);
}

export async function validarContratoAction(id: string) {
  await cadastroAdminController.validarContrato(id);
  revalidatePath(`/painel/${id}`);
}

export async function ativarClienteAction(id: string) {
  await cadastroAdminController.ativarCliente(id);
  revalidatePath(`/painel/${id}`);
}

export async function recusarCadastroAction(id: string) {
  await cadastroAdminController.recusarCadastro(id);
  revalidatePath(`/painel/${id}`);
}

export async function aprovarDocumentoAction(agenciaId: string, documentoId: string) {
  await cadastroAdminController.aprovarDocumento(documentoId);
  revalidatePath(`/painel/${agenciaId}`);
}

export async function reprovarDocumentoAction(
  agenciaId: string,
  documentoId: string,
  formData: FormData,
) {
  const session = await getServerSession(nextAuthOptions);
  const motivo = String(formData.get("motivo") ?? "");

  await cadastroAdminController.reprovarDocumento({
    id: documentoId,
    motivo,
    reprovadoPor: session?.user?.email ?? null,
  });
  revalidatePath(`/painel/${agenciaId}`);
}

export async function solicitarReenvioDocumentosAction(agenciaId: string, formData: FormData) {
  const documentoIds = formData.getAll("documentoIds").map(String);
  await cadastroAdminController.solicitarReenvioDocumentos({ agenciaId, documentoIds });
  revalidatePath(`/painel/${agenciaId}`);
}

async function analistaLogado(): Promise<string> {
  const session = await getServerSession(nextAuthOptions);
  return session?.user?.email ?? session?.user?.name ?? "analista não identificado";
}

export async function salvarSicaAction(agenciaId: string, formData: FormData) {
  const codigo = String(formData.get("codigo") ?? "");
  await cadastroAdminController.salvarSica({
    agenciaId,
    codigo,
    salvoPor: await analistaLogado(),
  });
  revalidatePath(`/painel/${agenciaId}`);
}

export async function salvarTravelLinkAction(agenciaId: string, criado: boolean) {
  await cadastroAdminController.salvarTravelLink({
    agenciaId,
    criado,
    salvoPor: await analistaLogado(),
  });
  revalidatePath(`/painel/${agenciaId}`);
}

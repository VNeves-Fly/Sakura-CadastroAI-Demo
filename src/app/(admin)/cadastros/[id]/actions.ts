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
  revalidatePath(`/cadastros/${id}`);
}

export async function marcarContratoAssinadoAction(id: string) {
  await cadastroAdminController.marcarContratoAssinado(id);
  revalidatePath(`/cadastros/${id}`);
}

export async function validarContratoAction(id: string) {
  await cadastroAdminController.validarContrato(id);
  revalidatePath(`/cadastros/${id}`);
}

export async function ativarClienteAction(id: string) {
  await cadastroAdminController.ativarCliente(id);
  revalidatePath(`/cadastros/${id}`);
}

export async function recusarCadastroAction(id: string) {
  await cadastroAdminController.recusarCadastro(id);
  revalidatePath(`/cadastros/${id}`);
}

export async function reprocessarAnaliseAction(id: string) {
  await cadastroAdminController.reprocessarAnalise(id);
  revalidatePath(`/cadastros/${id}`);
}

export async function aprovarDocumentoAction(agenciaId: string, documentoId: string) {
  await cadastroAdminController.aprovarDocumento(documentoId);
  revalidatePath(`/cadastros/${agenciaId}`);
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
  revalidatePath(`/cadastros/${agenciaId}`);
}

export async function solicitarReenvioDocumentosAction(agenciaId: string, formData: FormData) {
  const documentoIds = formData.getAll("documentoIds").map(String);
  await cadastroAdminController.solicitarReenvioDocumentos({ agenciaId, documentoIds });
  revalidatePath(`/cadastros/${agenciaId}`);
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
  revalidatePath(`/cadastros/${agenciaId}`);
}

export async function atualizarAdministrativoSocioAction(
  agenciaId: string,
  representanteLegalId: string,
  administrativo: boolean | null,
) {
  await cadastroAdminController.atualizarRepresentanteLegal({
    id: representanteLegalId,
    administrativo,
  });
  revalidatePath(`/cadastros/${agenciaId}`);
}

export async function salvarTravelLinkAction(agenciaId: string, criado: boolean) {
  await cadastroAdminController.salvarTravelLink({
    agenciaId,
    criado,
    salvoPor: await analistaLogado(),
  });
  revalidatePath(`/cadastros/${agenciaId}`);
}

// Data de nascimento chega como ISO (YYYY-MM-DD, mesmo formato do
// DatePicker/<input type="date">) — string vazia (campo não preenchido)
// vira null em vez de uma Data inválida.
function parseDataIso(valor: string): Date | null {
  if (!valor) return null;
  const data = new Date(`${valor}T00:00:00`);
  return Number.isNaN(data.getTime()) ? null : data;
}

export async function salvarUsuarioMasterAction(agenciaId: string, formData: FormData) {
  const origemRepresentanteLegalId = String(formData.get("origemRepresentanteLegalId") ?? "");

  await cadastroAdminController.salvarUsuarioMaster({
    agenciaId,
    nome: String(formData.get("nome") ?? ""),
    email: String(formData.get("email") ?? ""),
    cpf: String(formData.get("cpf") ?? ""),
    telefone: String(formData.get("telefone") ?? ""),
    rg: String(formData.get("rg") ?? ""),
    rgOrgaoEmissor: String(formData.get("rgOrgaoEmissor") ?? ""),
    rgUf: String(formData.get("rgUf") ?? ""),
    dataNascimento: parseDataIso(String(formData.get("dataNascimento") ?? "")),
    origemRepresentanteLegalId: origemRepresentanteLegalId || null,
    salvoPor: await analistaLogado(),
  });
  revalidatePath(`/cadastros/${agenciaId}`);
}

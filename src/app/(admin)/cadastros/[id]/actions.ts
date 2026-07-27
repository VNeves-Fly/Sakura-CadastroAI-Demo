"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { getServerSession } from "next-auth";
import { nextAuthOptions } from "@/modules/auth/presentation/routes/next-auth.options";
import { cadastroAdminController } from "@/modules/cadastro/presentation/controllers/cadastro-admin.controller";
import { DomainError } from "@/modules/shared/domain/errors";
import { validarArquivoUpload } from "@/modules/cadastro/utils/arquivo-upload.util";
import { obterUrlBase } from "@/modules/shared/utils/url-base.util";
import type { TipoDocumento } from "@/modules/cadastro/domain/enums";

// Server Actions do dossiê — cada uma só dispara a ação no controller e
// revalida a própria página do dossiê (sem redirect: o form re-renderiza
// no mesmo lugar já com o novo status).

export async function aprovarComplementarAction(id: string) {
  await cadastroAdminController.aprovarComplementar({ id, analistaEmail: await analistaLogado() });
  revalidatePath(`/cadastros/${id}`);
}

export async function registrarContratoExternoAction(
  agenciaId: string,
  contratoId: string,
  provedorId: string,
): Promise<
  | { ok: true; nomeDocumento: string | null; statusName: string | null; avisos: string[] }
  | { ok: false; motivo: string }
> {
  try {
    const resultado = await cadastroAdminController.registrarContratoExterno({
      agenciaId,
      contratoId,
      provedorId,
    });
    if (resultado.ok) {
      revalidatePath(`/cadastros/${agenciaId}`);
    }
    return resultado;
  } catch (error) {
    if (error instanceof DomainError) {
      return { ok: false, motivo: error.message };
    }
    throw error;
  }
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

export async function reconsultarCreditoAction(agenciaId: string, fonte: "AMAT" | "SOFIA") {
  await cadastroAdminController.reconsultarCredito({
    agenciaId,
    fonte,
    consultadoPor: await analistaLogado(),
  });
  revalidatePath(`/cadastros/${agenciaId}`);
}

export async function aprovarDocumentoAction(
  agenciaId: string,
  documentoId: string,
  formData: FormData,
) {
  const session = await getServerSession(nextAuthOptions);
  const motivo = String(formData.get("motivo") ?? "");

  await cadastroAdminController.aprovarDocumento({
    id: documentoId,
    motivo,
    aprovadoPor: session?.user?.email ?? null,
  });
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

export async function inserirDocumentoManualAction(
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

  await cadastroAdminController.inserirDocumentoManual({
    agenciaId,
    representanteLegalId,
    tipo,
    arquivo: { buffer, originalName: arquivo.name, mimeType: arquivo.type },
    inseridoPor: session?.user?.email ?? session?.user?.name ?? "analista não identificado",
  });
  revalidatePath(`/cadastros/${agenciaId}`);
}

export async function solicitarReenvioDocumentosAction(agenciaId: string, formData: FormData) {
  const documentoIds = formData.getAll("documentoIds").map(String);
  const baseUrl = obterUrlBase(headers());
  await cadastroAdminController.solicitarReenvioDocumentos({ agenciaId, documentoIds, baseUrl });
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

function parseStringOuNull(valor: FormDataEntryValue | null): string | null {
  const texto = String(valor ?? "").trim();
  return texto.length > 0 ? texto : null;
}

export async function editarSocioAction(
  agenciaId: string,
  representanteLegalId: string,
  formData: FormData,
) {
  await cadastroAdminController.atualizarRepresentanteLegal({
    id: representanteLegalId,
    editadoPor: await analistaLogado(),
    justificativa: String(formData.get("justificativa") ?? ""),
    dados: {
      nome: String(formData.get("nome") ?? "").trim(),
      cpf: String(formData.get("cpf") ?? "").trim(),
      email: String(formData.get("email") ?? "").trim(),
      telefone: String(formData.get("telefone") ?? "").trim(),
      estadoCivil: String(formData.get("estadoCivil") ?? "").trim(),
      nacionalidade: parseStringOuNull(formData.get("nacionalidade")),
      rg: parseStringOuNull(formData.get("rg")),
      rgOrgaoEmissor: parseStringOuNull(formData.get("rgOrgaoEmissor")),
      dataNascimento: parseDataIso(String(formData.get("dataNascimento") ?? "")),
      administrativo: formData.get("administrativo") === "true",
    },
  });
  revalidatePath(`/cadastros/${agenciaId}`);
}

export async function editarEmpresaAction(agenciaId: string, formData: FormData) {
  await cadastroAdminController.editarDadosEmpresa({
    agenciaId,
    editadoPor: await analistaLogado(),
    justificativa: String(formData.get("justificativa") ?? ""),
    dadosAgencia: {
      razaoSocial: String(formData.get("razaoSocial") ?? "").trim(),
      emailContato: String(formData.get("emailContato") ?? "").trim(),
      telefoneContato: String(formData.get("telefoneContato") ?? "").trim(),
    },
    dadosComplementar: {
      telefoneComercial: parseStringOuNull(formData.get("telefoneComercial")),
      emailOperacional: parseStringOuNull(formData.get("emailOperacional")),
      emailComercial: parseStringOuNull(formData.get("emailComercial")),
      emailFinanceiro: parseStringOuNull(formData.get("emailFinanceiro")),
    },
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

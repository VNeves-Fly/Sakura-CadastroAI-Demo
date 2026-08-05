"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { getServerSession } from "next-auth";
import { nextAuthOptions } from "@/modules/auth/presentation/routes/next-auth.options";
import { cadastroAdminController } from "@/modules/cadastro/presentation/controllers/cadastro-admin.controller";
import { atendimentoController } from "@/modules/atendimento/presentation/controllers/atendimento.controller";
import { DomainError } from "@/modules/shared/domain/errors";
import { validarArquivoUpload } from "@/modules/cadastro/utils/arquivo-upload.util";
import { obterUrlBase } from "@/modules/shared/utils/url-base.util";
import type { TipoDocumento } from "@/modules/cadastro/domain/enums";

// Server Actions do dossiê — cada uma só dispara a ação no controller e
// revalida a própria página do dossiê (sem redirect: o form re-renderiza
// no mesmo lugar já com o novo status).

// Gestor/Executivo (2026-08-03) nunca conseguem assumir atendimento, então
// garantirAtendimentoAssumido já falharia sozinho pra eles — mas o reforço
// aqui é explícito (em vez de depender só desse efeito indireto), mesma
// postura do guard em atendimento-agencia.routes.ts.
const CARGOS_SEM_ATENDIMENTO = new Set(["GESTOR", "EXECUTIVO"]);

async function analistaIdLogado(): Promise<string> {
  const session = await getServerSession(nextAuthOptions);
  if (!session?.user?.id) throw new DomainError("Não autenticado.");
  if (session.user.cargo && CARGOS_SEM_ATENDIMENTO.has(session.user.cargo)) {
    throw new DomainError("Acesso não permitido.");
  }
  return session.user.id;
}

// Trava real (backend, não só UI) — alterar/aprovar/reprovar um cadastro
// exige que o analista logado tenha assumido o atendimento da agência
// antes (decisão do usuário, 2026-07-28). Chamada no início de toda action
// que muda estado; leitura (visualizar documento etc.) não passa por aqui.
// Devolve `false` (em vez de deixar o ConflictError subir cru) quando outro
// analista assumiu ou a sessão local ficou desatualizada — a UI já é
// gated por `podeAgir`/`atendimentoAssumidoPorMim` (ver page.tsx), então a
// revalidação abaixo é o bastante pra ela mostrar o estado real, sem
// derrubar a página com o "Application error" genérico do Next.
async function garantirAtendimentoAssumido(agenciaId: string): Promise<boolean> {
  try {
    await atendimentoController.garantirAtendimentoAssumido(agenciaId, await analistaIdLogado());
    return true;
  } catch (error) {
    if (!(error instanceof DomainError)) throw error;
    revalidatePath(`/cadastros/${agenciaId}`);
    return false;
  }
}

export async function aprovarComplementarAction(id: string, formData: FormData) {
  if (!(await garantirAtendimentoAssumido(id))) return;
  await cadastroAdminController.aprovarComplementar({
    id,
    analistaEmail: await analistaLogado(),
    gerarContratoAutomaticamente: formData.get("gerarContrato") !== null,
  });
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
    if (!(await garantirAtendimentoAssumido(agenciaId))) {
      return { ok: false, motivo: "Assuma o atendimento desta agência antes de agir." };
    }
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

export async function sincronizarContratoD4SignAction(agenciaId: string): Promise<
  | {
      ok: true;
      statusDocumento: string | null;
      adicionados: string[];
      removidos: string[];
      assinaturasAtualizadas: number;
      avancouStatus: boolean;
    }
  | { ok: false; motivo: string }
> {
  if (!(await garantirAtendimentoAssumido(agenciaId))) {
    return { ok: false, motivo: "Assuma o atendimento desta agência antes de agir." };
  }
  const resultado = await cadastroAdminController.sincronizarContratoD4Sign(agenciaId);
  if (resultado.ok) {
    revalidatePath(`/cadastros/${agenciaId}`);
  }
  return resultado;
}

export async function marcarContratoAssinadoAction(id: string) {
  if (!(await garantirAtendimentoAssumido(id))) return;
  await cadastroAdminController.marcarContratoAssinado(id);
  revalidatePath(`/cadastros/${id}`);
}

// ConfirmarCadastramentoUseCase agora exige SICA ativo no SST antes de
// avançar (2026-08-05) — mesmo padrão de resultado estruturado de
// salvarSicaAction, pra mostrar o motivo do bloqueio em vez de só quebrar.
export async function confirmarCadastramentoAction(
  id: string,
): Promise<{ ok: true } | { ok: false; motivo: string }> {
  if (!(await garantirAtendimentoAssumido(id))) {
    return { ok: false, motivo: "Assuma o atendimento desta agência antes de agir." };
  }
  try {
    await cadastroAdminController.confirmarCadastramento(id);
    revalidatePath(`/cadastros/${id}`);
    return { ok: true };
  } catch (error) {
    if (error instanceof DomainError) {
      return { ok: false, motivo: error.message };
    }
    throw error;
  }
}

export async function forcarAvancoStatusAction(agenciaId: string, formData: FormData) {
  if (!(await garantirAtendimentoAssumido(agenciaId))) return;
  await cadastroAdminController.forcarAvancoStatus({
    agenciaId,
    justificativa: String(formData.get("justificativa") ?? ""),
    forcadoPor: await analistaLogado(),
  });
  revalidatePath(`/cadastros/${agenciaId}`);
}

export async function cancelarContratoAction(agenciaId: string, formData: FormData) {
  if (!(await garantirAtendimentoAssumido(agenciaId))) return;
  await cadastroAdminController.cancelarContrato({
    agenciaId,
    justificativa: String(formData.get("justificativa") ?? ""),
    canceladoPor: await analistaLogado(),
  });
  revalidatePath(`/cadastros/${agenciaId}`);
}

export async function ativarClienteAction(id: string) {
  if (!(await garantirAtendimentoAssumido(id))) return;
  await cadastroAdminController.ativarCliente(id);
  revalidatePath(`/cadastros/${id}`);
}

export async function recusarCadastroAction(id: string) {
  if (!(await garantirAtendimentoAssumido(id))) return;
  await cadastroAdminController.recusarCadastro(id);
  revalidatePath(`/cadastros/${id}`);
}

export async function reprocessarAnaliseAction(id: string) {
  if (!(await garantirAtendimentoAssumido(id))) return;
  await cadastroAdminController.reprocessarAnalise(id);
  revalidatePath(`/cadastros/${id}`);
}

export async function reconsultarCreditoAction(agenciaId: string, fonte: "AMAT" | "SOFIA") {
  if (!(await garantirAtendimentoAssumido(agenciaId))) return;
  await cadastroAdminController.reconsultarCredito({
    agenciaId,
    fonte,
    consultadoPor: await analistaLogado(),
  });
  revalidatePath(`/cadastros/${agenciaId}`);
}

export async function consultarSicaAction(agenciaId: string) {
  if (!(await garantirAtendimentoAssumido(agenciaId))) return;
  await cadastroAdminController.consultarSica({
    agenciaId,
    consultadoPor: await analistaLogado(),
  });
  revalidatePath(`/cadastros/${agenciaId}`);
}

// Atualiza a situação do código SICA já salvo (botão "Atualizar" ao lado
// do código, ver ValidacaoSicaTravelLink) — busca por código, não por CNPJ
// (diferente de consultarSicaAction).
export async function atualizarSicaAction(agenciaId: string) {
  if (!(await garantirAtendimentoAssumido(agenciaId))) return;
  await cadastroAdminController.atualizarSica({
    agenciaId,
    atualizadoPor: await analistaLogado(),
  });
  revalidatePath(`/cadastros/${agenciaId}`);
}

export async function aprovarDocumentoAction(
  agenciaId: string,
  documentoId: string,
  formData: FormData,
) {
  if (!(await garantirAtendimentoAssumido(agenciaId))) return;
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
  if (!(await garantirAtendimentoAssumido(agenciaId))) return;
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
  if (!(await garantirAtendimentoAssumido(agenciaId))) return;
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
  if (!(await garantirAtendimentoAssumido(agenciaId))) return;
  const documentoIds = formData.getAll("documentoIds").map(String);
  const baseUrl = obterUrlBase(headers());
  await cadastroAdminController.solicitarReenvioDocumentos({ agenciaId, documentoIds, baseUrl });
  revalidatePath(`/cadastros/${agenciaId}`);
}

async function analistaLogado(): Promise<string> {
  const session = await getServerSession(nextAuthOptions);
  return session?.user?.email ?? session?.user?.name ?? "analista não identificado";
}

// SalvarSicaUseCase agora confirma o código no SST antes de salvar e
// bloqueia (DomainError) se o CNPJ retornado não bater com o da agência —
// mesmo padrão de resultado estruturado de registrarContratoExternoAction,
// pra o form conseguir mostrar o motivo do bloqueio em vez de só quebrar.
export async function salvarSicaAction(
  agenciaId: string,
  formData: FormData,
): Promise<{ ok: true } | { ok: false; motivo: string }> {
  if (!(await garantirAtendimentoAssumido(agenciaId))) {
    return { ok: false, motivo: "Assuma o atendimento desta agência antes de agir." };
  }
  const codigo = String(formData.get("codigo") ?? "");
  try {
    await cadastroAdminController.salvarSica({
      agenciaId,
      codigo,
      salvoPor: await analistaLogado(),
    });
    revalidatePath(`/cadastros/${agenciaId}`);
    return { ok: true };
  } catch (error) {
    if (error instanceof DomainError) {
      return { ok: false, motivo: error.message };
    }
    throw error;
  }
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
  if (!(await garantirAtendimentoAssumido(agenciaId))) return;
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
      endereco: {
        cep: String(formData.get("enderecoCep") ?? "").trim(),
        logradouro: String(formData.get("enderecoLogradouro") ?? "").trim(),
        numero: String(formData.get("enderecoNumero") ?? "").trim(),
        complemento: String(formData.get("enderecoComplemento") ?? "").trim(),
        bairro: String(formData.get("enderecoBairro") ?? "").trim(),
        cidade: String(formData.get("enderecoCidade") ?? "").trim(),
        uf: String(formData.get("enderecoUf") ?? "").trim(),
      },
    },
  });
  revalidatePath(`/cadastros/${agenciaId}`);
}

export async function adicionarSocioAction(agenciaId: string, formData: FormData) {
  if (!(await garantirAtendimentoAssumido(agenciaId))) return;

  const novoSocio = await cadastroAdminController.criarRepresentanteLegal({
    agenciaId,
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
  });

  // Imagem do documento é opcional na hora de adicionar — se enviada,
  // já entra pelo mesmo caminho de upload manual do dossiê (slot RG/CNH
  // do sócio recém-criado, ver InserirDocumentoManualUseCase).
  const arquivo = formData.get("arquivo");
  if (arquivo instanceof File && arquivo.size > 0) {
    const erroValidacao = validarArquivoUpload(arquivo, "Documento do sócio");
    if (erroValidacao) throw new DomainError(erroValidacao);

    const session = await getServerSession(nextAuthOptions);
    const buffer = Buffer.from(await arquivo.arrayBuffer());
    await cadastroAdminController.inserirDocumentoManual({
      agenciaId,
      representanteLegalId: novoSocio.id,
      tipo: "RG_CNPJ",
      arquivo: { buffer, originalName: arquivo.name, mimeType: arquivo.type },
      inseridoPor: session?.user?.email ?? session?.user?.name ?? "analista não identificado",
    });
  }

  revalidatePath(`/cadastros/${agenciaId}`);
}

export async function removerSocioAction(
  agenciaId: string,
  representanteLegalId: string,
  formData: FormData,
) {
  if (!(await garantirAtendimentoAssumido(agenciaId))) return;
  await cadastroAdminController.removerRepresentanteLegal({
    id: representanteLegalId,
    justificativa: String(formData.get("justificativa") ?? ""),
    removidoPor: await analistaLogado(),
  });
  revalidatePath(`/cadastros/${agenciaId}`);
}

export async function editarEmpresaAction(agenciaId: string, formData: FormData) {
  if (!(await garantirAtendimentoAssumido(agenciaId))) return;
  await cadastroAdminController.editarDadosEmpresa({
    agenciaId,
    editadoPor: await analistaLogado(),
    justificativa: String(formData.get("justificativa") ?? ""),
    dadosAgencia: {
      razaoSocial: String(formData.get("razaoSocial") ?? "").trim(),
      nomeFantasia: parseStringOuNull(formData.get("nomeFantasia")),
      emailContato: String(formData.get("emailContato") ?? "").trim(),
      telefoneContato: String(formData.get("telefoneContato") ?? "").trim(),
    },
    dadosComplementar: {
      telefoneComercial: parseStringOuNull(formData.get("telefoneComercial")),
      emailOperacional: parseStringOuNull(formData.get("emailOperacional")),
      emailComercial: parseStringOuNull(formData.get("emailComercial")),
      emailFinanceiro: parseStringOuNull(formData.get("emailFinanceiro")),
    },
    enderecoAgencia: {
      cep: String(formData.get("cep") ?? "").trim(),
      logradouro: String(formData.get("logradouro") ?? "").trim(),
      numero: String(formData.get("numero") ?? "").trim(),
      complemento: String(formData.get("complemento") ?? "").trim(),
      bairro: String(formData.get("bairro") ?? "").trim(),
      cidade: String(formData.get("cidade") ?? "").trim(),
      uf: String(formData.get("uf") ?? "").trim(),
    },
  });
  revalidatePath(`/cadastros/${agenciaId}`);
}

export async function salvarTravelLinkAction(agenciaId: string, criado: boolean) {
  if (!(await garantirAtendimentoAssumido(agenciaId))) return;
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
  if (!(await garantirAtendimentoAssumido(agenciaId))) return;
  const origemRepresentanteLegalId = String(formData.get("origemRepresentanteLegalId") ?? "");

  const nome = String(formData.get("nome") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const cpf = String(formData.get("cpf") ?? "").trim();
  const telefone = String(formData.get("telefone") ?? "").trim();
  const rg = String(formData.get("rg") ?? "").trim();
  const rgOrgaoEmissor = String(formData.get("rgOrgaoEmissor") ?? "").trim();
  const rgUf = String(formData.get("rgUf") ?? "").trim();
  const dataNascimento = parseDataIso(String(formData.get("dataNascimento") ?? ""));

  // Trava real (backend, não só UI) — o botão Salvar já vem desabilitado
  // do client enquanto faltar campo (ver usuario-master.tsx), mas sem essa
  // checagem aqui um Usuário Master incompleto passava batido: salvava com
  // "" nos campos vazios e só travava o "Ativar cliente" depois, sem
  // avisar o motivo (caso real 2026-07-29, agência com UF do RG em branco).
  if (!nome || !email || !cpf || !telefone || !rg || !rgOrgaoEmissor || !rgUf || !dataNascimento) {
    throw new DomainError("Preencha todos os campos do Usuário Master antes de salvar.");
  }

  await cadastroAdminController.salvarUsuarioMaster({
    agenciaId,
    nome,
    email,
    cpf,
    telefone,
    rg,
    rgOrgaoEmissor,
    rgUf,
    dataNascimento,
    origemRepresentanteLegalId: origemRepresentanteLegalId || null,
    salvoPor: await analistaLogado(),
  });
  revalidatePath(`/cadastros/${agenciaId}`);
}

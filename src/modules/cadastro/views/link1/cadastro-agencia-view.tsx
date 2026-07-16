"use client";

import { useCadastroAgenciaViewModel } from "@/modules/cadastro/view-models/use-cadastro-agencia.view-model";
import { BrandPanel } from "@/modules/cadastro/components/brand-panel";
import { AgenciaForm } from "@/modules/cadastro/components/agencia-form";

interface CadastroAgenciaViewProps {
  origem: string | null;
}

// View: só renderiza, delegando toda a lógica ao ViewModel.
export function CadastroAgenciaView({ origem }: CadastroAgenciaViewProps) {
  const viewModel = useCadastroAgenciaViewModel({ origem });

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-4 py-10">
      {viewModel.success ? (
        <div className="w-full max-w-md rounded-[2rem] border border-border bg-card p-8 text-center shadow-xl shadow-sakura-900/5">
          <h1 className="text-2xl font-semibold text-foreground">Cadastro enviado!</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Obrigado. Em breve você recebe por e-mail o link para completar o cadastro da sua
            agência.
          </p>
        </div>
      ) : viewModel.duplicado ? (
        <div className="w-full max-w-md rounded-[2rem] border border-border bg-card p-8 text-center shadow-xl shadow-sakura-900/5">
          <h1 className="text-2xl font-semibold text-foreground">Já Cadastrada</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Este CNPJ já possui um cadastro em andamento. Verifique seu e-mail para continuar de
            onde parou.
          </p>
        </div>
      ) : (
        <div className="flex w-full max-w-6xl overflow-hidden rounded-2xl border border-border shadow-2xl shadow-sakura-900/5 sm:rounded-[2rem]">
          <BrandPanel origem={origem} />
          <div className="flex w-full flex-col gap-6 bg-card p-6 sm:p-10">
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-semibold text-foreground">Cadastro de Agência</h1>
              <p className="text-sm text-muted-foreground">
                Preencha os dados da sua agência para iniciar o credenciamento.
              </p>
            </div>

            <AgenciaForm {...viewModel} />
          </div>
        </div>
      )}

      <footer className="flex w-full max-w-6xl flex-col items-center justify-between gap-2 text-xs text-muted-foreground sm:flex-row">
        <span>© {new Date().getFullYear()} Sakura Consolidadora</span>
        <div className="flex items-center gap-4">
          <a href="/termos" className="hover:text-foreground hover:underline">
            Termos de uso
          </a>
          <a href="/privacidade" className="hover:text-foreground hover:underline">
            Política de privacidade
          </a>
        </div>
      </footer>
    </div>
  );
}

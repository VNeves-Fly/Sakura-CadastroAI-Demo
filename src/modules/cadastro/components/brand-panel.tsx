import Image from "next/image";

interface BrandPanelProps {
  origem: string | null;
}

export function BrandPanel({ origem }: BrandPanelProps) {
  return (
    <div className="hidden w-full max-w-sm flex-col bg-gradient-to-br from-sakura-500 to-sakura-700 p-10 text-white sm:flex">
      <div className="flex flex-col items-center gap-6 text-center">
        <Image
          src="/logos/logo-sakura-oficial.png"
          alt="Sakura Consolidadora"
          width={200}
          height={70}
          className="h-14 w-auto object-contain brightness-0 invert"
          priority
        />

        {origem ? (
          <span className="w-fit rounded-full bg-white/15 px-3 py-1 text-xs font-medium">
            Cadastrando via {origem}
          </span>
        ) : null}
      </div>

      <div className="mt-12 flex flex-col gap-3 text-left">
        <h2 className="text-3xl font-extrabold leading-tight">
          Sua jornada para o <span className="italic">sucesso</span> começa aqui.
        </h2>
        <p className="text-sm text-white/85">
          Cadastre sua agência e tenha acesso às melhores condições do mercado de viagens.
        </p>
      </div>

      <div className="mt-auto flex flex-col gap-3 pt-10">
        <div className="border-t border-white/20" />
        <span className="text-center text-[11px] font-semibold uppercase tracking-widest text-white/70">
          © {new Date().getFullYear()} · Sakura Consolidadora
        </span>
      </div>
    </div>
  );
}

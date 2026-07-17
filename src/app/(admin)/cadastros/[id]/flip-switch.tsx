"use client";

// Flip switch — adaptado do estilo "flip" do CodePen de mallendeo
// (https://codepen.io/mallendeo/pen/QWKrEL, "Pure CSS toggle buttons"):
// checkbox escondido + duas faces sobrepostas (Não/Sim) que giram em 3D
// no eixo X, com backface-visibility:hidden pra só uma face ficar visível
// de cada vez. Aqui reimplementado com classes Tailwind (propriedades
// arbitrárias pro transform/backface-visibility, que o Tailwind não tem
// como utilitário nomeado) em vez de um arquivo CSS à parte, seguindo o
// padrão do resto do projeto.
interface FlipSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  id?: string;
  labelLigado?: string;
  labelDesligado?: string;
}

export function FlipSwitch({
  checked,
  onChange,
  id,
  labelLigado = "Sim",
  labelDesligado = "Não",
}: FlipSwitchProps) {
  return (
    <label
      htmlFor={id}
      className="border-border relative inline-block h-7 w-20 shrink-0 cursor-pointer overflow-hidden rounded-full border [perspective:400px]"
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="peer sr-only"
      />
      <span
        aria-hidden
        className="bg-destructive text-destructive-foreground absolute inset-0 flex [transform:rotateX(0deg)] items-center justify-center text-[11px] font-bold tracking-wide uppercase transition-transform duration-500 [backface-visibility:hidden] peer-checked:[transform:rotateX(180deg)]"
      >
        {labelDesligado}
      </span>
      <span
        aria-hidden
        className="bg-success text-success-foreground absolute inset-0 flex [transform:rotateX(180deg)] items-center justify-center text-[11px] font-bold tracking-wide uppercase transition-transform duration-[400ms] [backface-visibility:hidden] peer-checked:[transform:rotateX(0deg)]"
      >
        {labelLigado}
      </span>
    </label>
  );
}

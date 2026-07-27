"use client";

import { useId, useRef, useState, type DragEvent } from "react";
import { cn } from "@/lib/utils";

interface FileDropInputProps {
  label: string;
  accept: string;
  file: File | null;
  // Erro já decidido por quem chama (ViewModel) — este componente não
  // conhece nenhuma regra de validação de arquivo.
  erro?: string | null;
  onChange: (file: File | null) => void;
  required?: boolean;
  helperText?: string;
  disabled?: boolean;
  disabledHelperText?: string;
  // Chave estável do campo (ver CampoFaltante no view-model do wizard) —
  // usada só pra scroll/destaque de "campo obrigatório faltando depois de
  // tentar avançar", nada a ver com `erro` (mensagem de validação do
  // próprio arquivo).
  campo?: string;
  destaqueErro?: boolean;
}

function UploadIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 16V4" />
      <path d="M6.5 9.5 12 4l5.5 5.5" />
      <path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
    </svg>
  );
}

// Componente apenas de renderização: recebe o arquivo, o erro (já
// validado por quem chama) e o callback via props — não conhece
// ViewModel/Service nem nenhuma regra de validação.
export function FileDropInput({
  label,
  accept,
  file,
  erro = null,
  onChange,
  required,
  helperText,
  disabled = false,
  disabledHelperText,
  campo,
  destaqueErro = false,
}: FileDropInputProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    if (disabled) return;
    setIsDraggingOver(false);
    onChange(event.dataTransfer.files[0] ?? null);
  }

  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor={inputId}
        className="text-foreground text-xs font-bold tracking-wide uppercase"
      >
        {label}
        {required ? <span className="text-destructive"> *</span> : null}
      </label>
      <div
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled) setIsDraggingOver(true);
        }}
        onDragLeave={() => setIsDraggingOver(false)}
        onDrop={handleDrop}
        onClick={() => !disabled && inputRef.current?.click()}
        aria-disabled={disabled}
        data-campo={campo}
        className={cn(
          "group flex flex-col items-center justify-center gap-2 rounded-3xl border-2 border-dashed px-4 py-6 text-center text-sm transition",
          disabled
            ? "border-input bg-muted/30 cursor-not-allowed opacity-60"
            : "hover:border-primary hover:bg-accent cursor-pointer",
          isDraggingOver ? "border-primary bg-accent" : "border-input bg-background",
          destaqueErro && !disabled && "campo-erro-pulsante",
        )}
      >
        <span
          className={`transition ${
            disabled
              ? "text-muted-foreground"
              : isDraggingOver
                ? "text-primary"
                : "group-hover:text-primary text-muted-foreground"
          }`}
        >
          <UploadIcon />
        </span>

        <span
          className={`w-full break-words ${file ? "text-foreground" : "text-muted-foreground"}`}
        >
          {file
            ? file.name
            : disabled
              ? (disabledHelperText ?? helperText ?? "Complete o campo anterior primeiro")
              : (helperText ?? "Clique ou arraste o arquivo aqui")}
        </span>

        {file && !disabled ? (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onChange(null);
            }}
            className="text-destructive text-xs font-medium hover:underline"
          >
            Remover
          </button>
        ) : null}
      </div>
      {erro ? <span className="text-destructive text-xs font-medium">{erro}</span> : null}
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={accept}
        disabled={disabled}
        className="hidden"
        onChange={(event) => onChange(event.target.files?.[0] ?? null)}
      />
    </div>
  );
}

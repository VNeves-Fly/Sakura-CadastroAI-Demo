"use client";

import { useId, useRef, useState, type DragEvent } from "react";
import { validarArquivoUpload } from "@/modules/cadastro/utils/arquivo-upload.util";

interface FileDropInputProps {
  label: string;
  accept: string;
  file: File | null;
  onChange: (file: File | null) => void;
  required?: boolean;
  helperText?: string;
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

// Componente apenas de renderização: recebe o arquivo e o callback via
// props, não conhece ViewModel/Service.
export function FileDropInput({
  label,
  accept,
  file,
  onChange,
  required,
  helperText,
}: FileDropInputProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  function selecionarArquivo(candidato: File | null) {
    if (!candidato) {
      setErro(null);
      onChange(null);
      return;
    }

    const mensagemErro = validarArquivoUpload(candidato, label);
    setErro(mensagemErro);
    onChange(mensagemErro ? null : candidato);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDraggingOver(false);
    selecionarArquivo(event.dataTransfer.files[0] ?? null);
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
          setIsDraggingOver(true);
        }}
        onDragLeave={() => setIsDraggingOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`group hover:border-primary hover:bg-accent flex cursor-pointer flex-col items-center justify-center gap-2 rounded-3xl border-2 border-dashed px-4 py-6 text-center text-sm transition ${
          isDraggingOver ? "border-primary bg-accent" : "border-input bg-background"
        }`}
      >
        <span
          className={`group-hover:text-primary transition ${
            isDraggingOver ? "text-primary" : "text-muted-foreground"
          }`}
        >
          <UploadIcon />
        </span>

        <span
          className={`w-full break-words ${file ? "text-foreground" : "text-muted-foreground"}`}
        >
          {file ? file.name : (helperText ?? "Clique ou arraste o arquivo aqui")}
        </span>

        {file ? (
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
        className="hidden"
        onChange={(event) => selecionarArquivo(event.target.files?.[0] ?? null)}
      />
    </div>
  );
}

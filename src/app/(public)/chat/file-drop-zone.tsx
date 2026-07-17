"use client";

import { useState, type DragEvent } from "react";

interface FileDropZoneProps {
  instrucao: string;
  onArquivo: (nomeArquivo: string) => void;
}

export function FileDropZone({ instrucao, onArquivo }: FileDropZoneProps) {
  const [emArraste, setEmArraste] = useState(false);

  function aoSoltar(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setEmArraste(false);
    const arquivo = event.dataTransfer.files?.[0];
    if (arquivo) onArquivo(arquivo.name);
  }

  return (
    <div className="mb-4 ml-9 max-w-[220px]">
      <label
        onDragOver={(event) => {
          event.preventDefault();
          setEmArraste(true);
        }}
        onDragLeave={() => setEmArraste(false)}
        onDrop={aoSoltar}
        className={`flex cursor-pointer flex-col items-center gap-1 rounded-2xl border border-dashed px-4 py-4 text-center text-[10px] text-white/70 transition ${
          emArraste
            ? "border-accent bg-primary/20"
            : "border-accent/40 hover:bg-primary/10 bg-white/5"
        }`}
      >
        <span className="font-semibold text-white">
          {emArraste ? "Solte o arquivo aqui" : "Anexar ou arrastar arquivo"}
        </span>
        <span>{instrucao}</span>
        <input
          type="file"
          className="hidden"
          accept="image/*,.pdf"
          onChange={(event) => {
            const arquivo = event.target.files?.[0];
            if (arquivo) onArquivo(arquivo.name);
            event.target.value = "";
          }}
        />
      </label>
    </div>
  );
}

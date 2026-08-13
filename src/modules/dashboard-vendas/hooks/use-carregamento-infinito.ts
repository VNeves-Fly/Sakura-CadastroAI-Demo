"use client";

import { useEffect, useState } from "react";

const LOTE = 20;

// Scroll infinito genérico — carrega os itens 20 a 20 conforme o usuário
// rola até o fim da lista visível, sempre respeitando a ordem original
// do array (nunca reordena, só revela mais itens).
//
// `scrollRef`/`sentinelaRef` são callback refs (não `useRef` comum) de
// propósito: o Dialog só monta o conteúdo no DOM quando abre, então um
// `useRef` fixado no primeiro render nunca veria o elemento real —
// callback ref dispara de novo sempre que o nó monta, resolvendo isso.
export function useCarregamentoInfinito<T>(itens: T[]) {
  const [quantidadeVisivel, setQuantidadeVisivel] = useState(LOTE);
  const [containerEl, setContainerEl] = useState<HTMLElement | null>(null);
  const [sentinelaEl, setSentinelaEl] = useState<HTMLElement | null>(null);

  // Reseta ao trocar a lista (ex.: usuário mudou de Mês pra Ano, ou abriu
  // outro card) — senão ficaria mostrando itens da lista anterior.
  useEffect(() => {
    setQuantidadeVisivel(LOTE);
  }, [itens]);

  useEffect(() => {
    if (!containerEl || !sentinelaEl) return;
    const observer = new IntersectionObserver(
      (entradas) => {
        if (entradas[0]?.isIntersecting) {
          setQuantidadeVisivel((atual) => Math.min(itens.length, atual + LOTE));
        }
      },
      { root: containerEl, rootMargin: "200px" },
    );
    observer.observe(sentinelaEl);
    return () => observer.disconnect();
  }, [containerEl, sentinelaEl, itens.length]);

  return {
    itensVisiveis: itens.slice(0, quantidadeVisivel),
    scrollRef: setContainerEl,
    sentinelaRef: setSentinelaEl,
    temMais: quantidadeVisivel < itens.length,
  };
}

// Opção do filtro único de /cadastros (Base, Gestor, Executivo,
// Associação, Status) — tipo centralizado aqui (fora do componente de
// view, ver filtro-cadastros-field.tsx) porque é reaproveitado também
// por quem monta as opções (cadastros/page.tsx), evitando duas fontes da
// mesma forma de dado (DRY).
export interface OpcaoFiltroCadastros {
  // Prefixado por categoria (ex.: "base:SP", "executivo:<id>") — é assim
  // que a categoria sobrevive ao roundtrip de um <form method="GET">
  // nativo, que só serializa o value mesmo.
  value: string;
  label: string;
  categoria: string;
}

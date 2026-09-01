import * as React from "react";

// Mesmo padrão de use-mobile.ts, generalizado pra qualquer media query
// (usado pelo dashboard pra desligar o recurso de expandir card de KPI
// abaixo do breakpoint xl, onde o layout 2/3+1/3 não cabe).
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = React.useState(false);

  React.useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    mql.addEventListener("change", onChange);
    setMatches(mql.matches);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);

  return matches;
}

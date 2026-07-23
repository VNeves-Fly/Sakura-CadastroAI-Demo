import type { Config } from "jest";
import nextJest from "next/jest.js";

// next/jest cuida do SWC (mesmo compilador do build) e do CSS/imagens
// mockados — mas o alias "@/" só é resolvido pelo SWC na hora de
// transformar `import`, não pelo resolver do próprio Jest. Isso funciona
// pra imports normais só por sorte da ordem de transformação, mas
// `jest.mock("@/...")` (que passa direto pelo resolver do Jest, sem
// transform) não resolve sem isso — moduleNameMapper abaixo espelha os
// paths do tsconfig.json manualmente.
const createJestConfig = nextJest({ dir: "./" });

const config: Config = {
  // Testes de unidade (validadores, adapters, use-cases): não tocam DOM,
  // então "node" é o ambiente correto — mais rápido e sem overhead de
  // jsdom. Um teste que precisar de DOM pode sobrescrever por arquivo com
  // `/** @jest-environment jsdom */` no topo (jest-environment-jsdom já
  // é uma dependência instalada).
  testEnvironment: "node",
  clearMocks: true,
  moduleNameMapper: {
    "^@/modules/(.*)$": "<rootDir>/src/modules/$1",
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  // fixtures.ts é helper compartilhado (fakes de repositório/serviço),
  // não teste — sem isso o Jest tenta rodá-lo como suíte (testMatch do
  // preset do next/jest casa qualquer .ts dentro de __tests__/).
  testPathIgnorePatterns: [
    "<rootDir>/.next/",
    "<rootDir>/node_modules/",
    "<rootDir>/__tests__/modules/atendimento/fixtures.ts",
  ],
  collectCoverageFrom: [
    "src/modules/**/*.{ts,tsx}",
    "!src/modules/**/*.d.ts",
    "!src/modules/**/types/**",
  ],
};

export default createJestConfig(config);

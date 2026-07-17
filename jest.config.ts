import type { Config } from "jest";
import nextJest from "next/jest.js";

// next/jest cuida do SWC (mesmo compilador do build), do CSS/imagens
// mockados e dos path aliases lidos do tsconfig.json — sem precisar de
// ts-jest nem configurar transform na mão.
const createJestConfig = nextJest({ dir: "./" });

const config: Config = {
  // Testes de unidade (validadores, adapters, use-cases): não tocam DOM,
  // então "node" é o ambiente correto — mais rápido e sem overhead de
  // jsdom. Um teste que precisar de DOM pode sobrescrever por arquivo com
  // `/** @jest-environment jsdom */` no topo (jest-environment-jsdom já
  // é uma dependência instalada).
  testEnvironment: "node",
  clearMocks: true,
  testPathIgnorePatterns: ["<rootDir>/.next/", "<rootDir>/node_modules/"],
  collectCoverageFrom: [
    "src/modules/**/*.{ts,tsx}",
    "!src/modules/**/*.d.ts",
    "!src/modules/**/types/**",
  ],
};

export default createJestConfig(config);

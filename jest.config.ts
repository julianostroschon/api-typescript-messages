import { resolve } from 'path';
import type { JestConfigWithTsJest } from 'ts-jest';

const root = resolve(__dirname);

const jestConfig: JestConfigWithTsJest = {
  rootDir: root,
  displayName: "api-typescript-messages",
  testMatch: ["<rootDir>/test/**/*.test.ts"],
  testEnvironment: "node",
  clearMocks: true,
  // Use the specific preset for consistency
  preset: "ts-jest",

  // Configuração explícita dos alias para garantir que funcionem nos testes
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@test/(.*)$': '<rootDir>/test/$1'
  },

  transform: {
    // Specify the tsconfig file if it's different from the default
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: './tsconfig.json',
      useESM: true,
    }],
  },

  moduleFileExtensions: ["ts", "js", "json", "node"],
  setupFilesAfterEnv: ["<rootDir>/test/jest.setup.ts"],
  collectCoverageFrom: [
    "<rootDir>/src/**/*.ts",
    "!<rootDir>/src/**/index.ts",
    "!<rootDir>/src/types/**/*.ts"
  ],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov"],
  testPathIgnorePatterns: [
    "/node_modules/",
    "/dist/",
    "jest.setup.ts"
  ]
};

export default jestConfig;
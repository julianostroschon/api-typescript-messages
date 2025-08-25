import { readFileSync } from 'fs';
import { resolve } from 'path';
import type { JestConfigWithTsJest } from 'ts-jest';
import { pathsToModuleNameMapper } from 'ts-jest';

// Read the tsconfig.json file synchronously and parse it
const tsconfig = JSON.parse(readFileSync('./tsconfig.json', 'utf8'));
const root = resolve(__dirname);

const jestConfig: JestConfigWithTsJest = {
  rootDir: root,
  displayName: "api-typescript-messages",
  testMatch: ["<rootDir>/test/**/*.test.ts"],
  testEnvironment: "node",
  clearMocks: true,
  // Use the specific ESM preset for consistency
  preset: "ts-jest/presets/default-esm",

  // Use pathsToModuleNameMapper to generate the mapping correctly
  moduleNameMapper: pathsToModuleNameMapper(tsconfig.compilerOptions.paths, { prefix: '<rootDir>/' }),

  transform: {
    // Specify the tsconfig file if it's different from the default
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: './tsconfig.json',
      useESM: true,
    }],
  },

  moduleFileExtensions: ["ts", "js", "json", "node"],
  // setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
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
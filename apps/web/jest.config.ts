/**
 * File:        apps/web/jest.config.ts
 * Module:      web · Jest Configuration
 * Purpose:     Jest configuration using ts-jest for TypeScript and JSX
 *              transformation. (Babel is intentionally not used here —
 *              apps/web uses Next.js SWC for the dev/build pipeline, and
 *              adding a babel.config.js would force Next to disable SWC
 *              and break `next/font`.)
 *
 * Author:      BharatERP
 * Last-updated: 2026-06-07
 */

import type { Config } from 'jest';

const config: Config = {
  displayName: 'web',
  testEnvironment: 'jsdom',
  rootDir: '.',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  testMatch: [
    '<rootDir>/features/**/*.spec.ts',
    '<rootDir>/features/**/*.spec.tsx',
    '<rootDir>/shared/**/*.spec.ts',
    '<rootDir>/shared/**/*.spec.tsx',
    '<rootDir>/app/**/*.spec.ts',
    '<rootDir>/app/**/*.spec.tsx',
    '<rootDir>/lib/**/*.spec.ts',
    '<rootDir>/lib/**/*.spec.tsx',
  ],
  // Use ts-jest for TypeScript and JS transformation (includes JSX).
  // ts-jest handles mixed TypeScript/JSX files and keeps Jest independent
  // of the Next.js SWC pipeline.
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/features/(.*)$': '<rootDir>/features/$1',
    '^@/features$': '<rootDir>/features',
    '^@/shared/(.*)$': '<rootDir>/shared/$1',
    '^@/shared$': '<rootDir>/shared',
    '^@/gql/(.*)$': '<rootDir>/gql/$1',
    '^@/gql$': '<rootDir>/gql',
    '^@/lib/(.*)$': '<rootDir>/lib/$1',
    '^@/lib$': '<rootDir>/lib',
    '^next/navigation$': '<rootDir>/jest.env-mocks.ts',
    '^next/dynamic$': '<rootDir>/jest.env-mocks.ts',
    '^next/font$': '<rootDir>/jest.env-mocks.ts',
    '^nanoid$': '<rootDir>/jest.mocks.ts',
    '^@obsidian/trading-ui$': '<rootDir>/jest.env-mocks.ts',
  },
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/.next/',
    '<rootDir>/dist/',
    '<rootDir>/coverage/',
  ],
};

export default config;
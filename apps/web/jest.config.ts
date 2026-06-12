/**
 * File:        apps/web/jest.config.ts
 * Module:      web · Jest Configuration
 * Purpose:     Jest configuration using babel for JSX transformation
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
  // Use babel to handle JSX - ts-jest only handles .ts files
  transform: {
    '^.+\\.tsx?$': ['babel-jest', { rootMode: 'upward' }],
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
/**
 * @file jest.config.cjs
 * @module obsidian-ui
 * @description Jest config for Obsidian UI (jsdom + RTL)
 * @author BharatERP
 * @created 2026-04-03
 */

/** @type {import('jest').Config} */
const config = {
  displayName: 'obsidian-ui',
  preset: '../../jest.preset.js',
  testEnvironment: 'jsdom',
  rootDir: '.',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  testMatch: ['<rootDir>/src/**/*.spec.tsx', '<rootDir>/src/**/*.spec.ts'],
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
      },
    ],
  },
  setupFilesAfterEnv: ['<rootDir>/src/test-setup.ts'],
  collectCoverageFrom: ['<rootDir>/src/**/*.{ts,tsx}', '!<rootDir>/src/**/*.spec.*'],
  coverageDirectory: '../../coverage/libs/obsidian-ui',
};

module.exports = config;

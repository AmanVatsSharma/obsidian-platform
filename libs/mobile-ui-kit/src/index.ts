/**
 * @file index.ts
 * @module mobile-ui-kit
 * @description Shared UI primitives for mobile surfaces; navigation types align with Obsidian UI.
 * @author BharatERP
 * @created 2026-02-19
 * @last-updated 2026-04-03
 */

import type { UiNavItem } from '@obsidian/obsidian-ui';

export type { UiNavItem };

export type MobileNavItem = {
  label: string;
  route: string;
};

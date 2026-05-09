/**
 * @file navigation.ts
 * @module obsidian-ui
 * @description Shared navigation item contract for shells and nav components
 * @author BharatERP
 * @created 2026-04-03
 */

export type UiNavItem = {
  label: string;
  href: string;
  description?: string;
};

/**
 * Builds a consistent document / section title across Obsidian surfaces.
 */
export function buildSectionTitle(title: string): string {
  return `Obsidian ${title}`;
}

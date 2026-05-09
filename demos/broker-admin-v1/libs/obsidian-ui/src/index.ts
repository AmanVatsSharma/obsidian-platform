/**
 * @file index.ts
 * @module obsidian-ui
 * @description Public API for Obsidian UI — explicit exports only (no barrel `export *`).
 * @author BharatERP
 * @created 2026-04-03
 *
 * Notes:
 * - **Server Components:** `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`,
 *   `CardFooter`, `AppShell`, `PageHeader`, `ContentFrame`, contracts (`buildSectionTitle`, types).
 * - **Client Components:** `Button`, `Input`, `ObsidianDialog`, `ObsidianTooltip`, `ObsidianProvider`,
 *   `useObsidian`, `cn` (safe in both; uses no hooks).
 */

export type { ShellConfig } from './contracts/shell';
export { buildSectionTitle, type UiNavItem } from './contracts/navigation';
export { obsidianTailwindPreset } from './tailwind/preset';
export { cn } from './react/utils/cn';
export type { ObsidianDensity, ObsidianThemeMode, ObsidianContextValue } from './react/theme/types';
export { ObsidianProvider, useObsidian, type ObsidianProviderProps } from './react/theme/obsidian-context';
export { Button, buttonVariants, type ButtonProps } from './react/primitives/button';
export { Input, type InputProps } from './react/primitives/input';
export {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  type CardProps,
} from './react/primitives/card';
export { ObsidianDialog, type ObsidianDialogProps } from './react/primitives/dialog';
export { ObsidianTooltip, type ObsidianTooltipProps } from './react/primitives/tooltip';
export { AppShell, type AppShellProps } from './react/layouts/app-shell';
export { PageHeader, type PageHeaderProps } from './react/layouts/page-header';
export { ContentFrame, type ContentFrameProps } from './react/layouts/content-frame';

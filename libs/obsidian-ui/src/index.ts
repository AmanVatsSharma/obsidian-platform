/**
 * @file index.ts
 * @module obsidian-ui
 * @description Public API for Obsidian UI — explicit exports only (no barrel `export *`).
 * @author BharatERP
 * @created 2026-04-03
 * @last-updated 2026-05-09
 *
 * Notes:
 * - **Server Components:** `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`,
 *   `CardFooter`, `AppShell`, `PageHeader`, `ContentFrame`, contracts (`buildSectionTitle`, types).
 * - **Client Components:** `Button`, `Input`, `ObsidianDialog`, `ObsidianTooltip`, `ObsidianProvider`,
 *   `useObsidian`, `cn` (safe in both; uses no hooks), and the eight new primitives below
 *   (Badge, Toggle, Segmented, Select, Progress, Sparkline, Icon, Toast/ToastProvider).
 */

export type { ShellConfig } from './contracts/shell';
export { buildSectionTitle, type UiNavItem } from './contracts/navigation';
export { obsidianTailwindPreset } from './tailwind/preset';
export { cn } from './react/utils/cn';
export type {
  ObsidianAccent,
  ObsidianContextValue,
  ObsidianDensity,
  ObsidianThemeMode,
} from './react/theme/types';
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

/* ─── New primitives (2026-05-09) — Account Console build ────────────── */
export {
  ObsidianBadge,
  type ObsidianBadgeKind,
  type ObsidianBadgeProps,
} from './react/primitives/badge';
export { ObsidianToggle, type ObsidianToggleProps } from './react/primitives/toggle';
export {
  ObsidianSegmented,
  type ObsidianSegmentedOption,
  type ObsidianSegmentedProps,
} from './react/primitives/segmented';
export {
  ObsidianSelect,
  type ObsidianSelectOption,
  type ObsidianSelectProps,
} from './react/primitives/select';
export {
  ObsidianProgress,
  type ObsidianProgressKind,
  type ObsidianProgressProps,
} from './react/primitives/progress';
export {
  ObsidianSparkline,
  type ObsidianSparklineProps,
} from './react/primitives/sparkline';
export {
  ObsidianIcon,
  type ObsidianIconName,
  type ObsidianIconProps,
} from './react/primitives/icon';
export {
  ToastProvider,
  useToast,
  type ToastInput,
  type ToastKind,
} from './react/primitives/toast';

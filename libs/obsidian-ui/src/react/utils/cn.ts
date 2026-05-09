/**
 * @file cn.ts
 * @module obsidian-ui
 * @description Merge Tailwind class names (clsx + tailwind-merge)
 * @author BharatERP
 * @created 2026-04-03
 */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

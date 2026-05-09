/**
 * @file tooltip.tsx
 * @module obsidian-ui
 * @description Tooltip (Radix). Client component — ObsidianProvider includes TooltipProvider.
 * @author BharatERP
 * @created 2026-04-03
 */

'use client';

import * as Tooltip from '@radix-ui/react-tooltip';
import * as React from 'react';

import { cn } from '../utils/cn';

export type ObsidianTooltipProps = {
  content: React.ReactNode;
  children: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
};

export function ObsidianTooltip({ content, children, side = 'top' }: ObsidianTooltipProps) {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>{children}</Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content
          side={side}
          sideOffset={6}
          className={cn(
            'z-50 max-w-xs rounded-obs border border-obsidian-border bg-obsidian-inverse px-3 py-1.5 text-xs text-obsidian-on-inverse shadow-obs',
          )}
        >
          {content}
          <Tooltip.Arrow className="fill-obsidian-inverse" />
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}

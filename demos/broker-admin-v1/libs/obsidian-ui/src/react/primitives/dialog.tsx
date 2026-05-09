/**
 * @file dialog.tsx
 * @module obsidian-ui
 * @description Modal dialog (Radix Dialog). Client component — use inside ObsidianProvider.
 * @author BharatERP
 * @created 2026-04-03
 */

'use client';

import * as Dialog from '@radix-ui/react-dialog';
import * as React from 'react';

import { cn } from '../utils/cn';
import { Button } from './button';

export type ObsidianDialogProps = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger: React.ReactNode;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

export function ObsidianDialog({
  open,
  onOpenChange,
  trigger,
  title,
  description,
  children,
  footer,
}: ObsidianDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-obsidian-inverse/40 backdrop-blur-sm" />
        <Dialog.Content
          className={cn(
            'fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2',
            'rounded-obs-lg border border-obsidian-border bg-obsidian-elevated p-6 text-obsidian-primary shadow-obs',
            'focus-visible:outline focus-visible:outline-2 focus-visible:outline-obsidian-ring',
          )}
        >
          <div className="mb-4 flex flex-col gap-2">
            <Dialog.Title className="text-lg font-semibold">{title}</Dialog.Title>
            {description ? (
              <Dialog.Description className="text-sm text-obsidian-secondary">
                {description}
              </Dialog.Description>
            ) : null}
          </div>
          <div className="max-h-[60vh] overflow-y-auto">{children}</div>
          <div className="mt-6 flex justify-end gap-2">
            {footer ?? (
              <Dialog.Close asChild>
                <Button variant="secondary" type="button">
                  Close
                </Button>
              </Dialog.Close>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/**
 * File:        apps/web/features/console/components/local/console-modal.tsx
 * Module:      web · Console · Modal Helper
 * Purpose:     Controlled modal that matches the design's `.modal` chrome exactly.
 *              Wraps Radix Dialog primitives (focus-trap, ESC, click-outside, portal,
 *              a11y) with the project's verbatim CSS classes.
 *
 * Exports:
 *   - ConsoleModal      — React.FC<ConsoleModalProps>
 *   - ConsoleModalProps — { open, onClose, title, icon, children, footer, width? }
 *
 * Depends on:
 *   - @radix-ui/react-dialog — accessibility-correct dialog primitives
 *   - @obsidian/obsidian-ui   — ObsidianIcon for the title-row icon and close 'x'
 *
 * Side-effects:
 *   - Mounts content into document.body via Radix Portal while open.
 *
 * Key invariants:
 *   - Always controlled — the design uses { open, onClose } not Radix's trigger child.
 *   - Renders nothing when closed (Radix handles unmount).
 *   - Focus is trapped to the dialog by Radix; ESC and click-outside both call onClose.
 *
 * Author:       BharatERP
 * Last-updated: 2026-05-09
 */

'use client';

import * as Dialog from '@radix-ui/react-dialog';
import * as React from 'react';

import { ObsidianIcon, type ObsidianIconName } from '@obsidian/obsidian-ui';

export type ConsoleModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  icon?: ObsidianIconName;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: number;
};

export function ConsoleModal({
  open,
  onClose,
  title,
  icon,
  children,
  footer,
  width = 480,
}: ConsoleModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={(next) => !next && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="obsidian-console-modal-overlay" />
        <Dialog.Content
          className="obsidian-console-modal"
          style={{ maxWidth: width }}
          onEscapeKeyDown={onClose}
          onPointerDownOutside={onClose}
        >
          <div className="modal-hd">
            {icon && <ObsidianIcon name={icon} size={16} />}
            <Dialog.Title asChild>
              <h3>{title}</h3>
            </Dialog.Title>
            <button type="button" className="x" onClick={onClose} aria-label="Close">
              <ObsidianIcon name="X" size={16} />
            </button>
          </div>
          <div className="modal-bd">{children}</div>
          {footer && <div className="modal-ft">{footer}</div>}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

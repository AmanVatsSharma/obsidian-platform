/**
 * File:        apps/desktop-pro/renderer/src/features/layout-engine/panel-slot.tsx
 * Module:      desktop-pro · Renderer · Layout Engine · Panel Slot
 * Purpose:     Draggable resize handle — a 4px invisible strip that becomes visible on hover/drag
 *              and updates a layout dimension via pointer events.
 *
 * Exports:
 *   - ResizeHandle({ axis, side, value, min, max, onResize }) → ReactNode
 *     axis  — 'x' (left/right column resize) | 'y' (top/bottom row resize)
 *     side  — where the handle sits: 'left' | 'right' | 'bottom'
 *     value — current size of the panel being resized (px)
 *     min   — minimum allowed size (px)
 *     max   — maximum allowed size (px)
 *
 * Depends on:
 *   - react — useRef
 *
 * Side-effects:
 *   - addEventListener pointermove/pointerup on window while dragging (cleaned up on pointerup)
 *
 * Key invariants:
 *   - Pointer events are registered on window (not the handle) so fast sweeps don't lose tracking
 *   - The handle is positioned absolute within the nearest `position: relative` ancestor (.layout-engine-canvas)
 *   - `side === 'right'` and `side === 'bottom'` invert the delta so dragging left/up grows the panel
 *
 * Read order:
 *   1. ResizeHandle — component + pointer logic
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-26
 */

import { useRef } from 'react';

type ResizeHandleProps = {
  axis: 'x' | 'y';
  side: 'left' | 'right' | 'bottom';
  value: number;
  min: number;
  max: number;
  onResize: (v: number) => void;
};

export function ResizeHandle({ axis, side, value, min, max, onResize }: ResizeHandleProps) {
  const dragRef = useRef<{ startClient: number; startValue: number } | null>(null);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    dragRef.current = {
      startClient: axis === 'x' ? e.clientX : e.clientY,
      startValue: value,
    };

    const onMove = (ev: PointerEvent) => {
      if (!dragRef.current) return;
      const current = axis === 'x' ? ev.clientX : ev.clientY;
      const rawDelta = current - dragRef.current.startClient;
      // Right and bottom panels grow when you drag towards the center (negative direction)
      const delta = side === 'right' || side === 'bottom' ? -rawDelta : rawDelta;
      onResize(Math.max(min, Math.min(max, dragRef.current.startValue + delta)));
    };

    const onUp = () => {
      dragRef.current = null;
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  const style: React.CSSProperties = {
    position: 'absolute',
    zIndex: 200,
    cursor: axis === 'x' ? 'ew-resize' : 'ns-resize',
    ...(side === 'left'   && { left: `${value}px`,  top: 0,            bottom: 0,          width:  4, transform: 'translateX(-2px)' }),
    ...(side === 'right'  && { right: `${value}px`, top: 0,            bottom: 0,          width:  4, transform: 'translateX(2px)'  }),
    ...(side === 'bottom' && { left: 0,              right: 0,          bottom: `${value + 24}px`, height: 4, transform: 'translateY(2px)' }),
  };

  return (
    <div
      className="layout-resize-handle"
      style={style}
      onPointerDown={onPointerDown}
    />
  );
}

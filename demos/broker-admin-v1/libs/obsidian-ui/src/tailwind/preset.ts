/**
 * @file preset.ts
 * @module obsidian-ui
 * @description Tailwind preset mapping Obsidian Design System CSS variables.
 *              Exposes both the legacy obsidian.* utilities (backward-compat)
 *              and the new dark-terminal trading utilities (bull, bear, fg1, etc.).
 * @author BharatERP
 * @last-updated 2026-04-24
 */

import type { Config } from 'tailwindcss';

export const obsidianTailwindPreset: Partial<Config> = {
  theme: {
    extend: {
      colors: {
        /* Legacy obsidian.* utilities — components use these; do not remove */
        obsidian: {
          canvas:        'var(--obs-surface-canvas)',
          elevated:      'var(--obs-surface-elevated)',
          muted:         'var(--obs-surface-muted)',
          inverse:       'var(--obs-surface-inverse)',
          primary:       'var(--obs-text-primary)',
          secondary:     'var(--obs-text-secondary)',
          faint:         'var(--obs-text-muted)',
          border:        'var(--obs-border-default)',
          'border-strong': 'var(--obs-border-strong)',
          action:        'var(--obs-action-primary)',
          'action-hover': 'var(--obs-action-primary-hover)',
          'action-fg':   'var(--obs-action-primary-fg)',
          danger:        'var(--obs-danger)',
          ring:          'var(--obs-ring)',
          'on-inverse':  'var(--obs-text-on-inverse)',
        },
        /* Dark-terminal surface tokens */
        'bg-base':     'var(--bg-base)',
        'bg-surface':  'var(--bg-surface)',
        'bg-panel':    'var(--bg-panel)',
        'bg-elevated': 'var(--bg-elevated)',
        'bg-hover':    'var(--bg-hover)',
        'bg-active':   'var(--bg-active)',
        /* Border tokens */
        'border-md':   'var(--border-md)',
        'border-hi':   'var(--border-hi)',
        /* Text tokens */
        fg1:           'var(--fg1)',
        fg2:           'var(--fg2)',
        fg3:           'var(--fg3)',
        fg4:           'var(--fg4)',
        /* Semantic trading colors */
        bull:          'var(--bull)',
        bear:          'var(--bear)',
        warn:          'var(--warn)',
        purple:        'var(--purple)',
        gold:          'var(--gold)',
        accent:        'var(--accent)',
        'bull-dim':    'var(--bull-dim)',
        'bear-dim':    'var(--bear-dim)',
        'warn-dim':    'var(--warn-dim)',
        'accent-dim':  'var(--accent-dim)',
      },
      borderRadius: {
        obs:     'var(--obs-radius-md)',    /* 6px — buttons, inputs */
        'obs-sm': 'var(--obs-radius-sm)',   /* 4px — tags, pills */
        'obs-lg': 'var(--obs-radius-lg)',   /* 12px — modals */
        'r-sm':  'var(--r-sm)',
        'r-md':  'var(--r-md)',
        'r-lg':  'var(--r-lg)',
        'r-xl':  'var(--r-xl)',
      },
      fontFamily: {
        sans:    ['var(--font-ui)',      'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono:    ['var(--font-data)',    'ui-monospace', 'monospace'],
        display: ['var(--font-display)', 'sans-serif'],
      },
      boxShadow: {
        obs:           'var(--shadow-panel)',
        'obs-sm':      'var(--shadow-panel)',
        'obs-float':   'var(--shadow-float)',
        'glow-bull':   'var(--shadow-glow-bull)',
        'glow-bear':   'var(--shadow-glow-bear)',
        'glow-accent': 'var(--shadow-glow-accent)',
      },
      spacing: {
        'obs':   'calc(var(--obs-space-unit) * 4)',   /* 16px */
        'obs-2': 'calc(var(--obs-space-unit) * 6)',   /* 24px */
        'obs-3': 'calc(var(--obs-space-unit) * 8)',   /* 32px */
      },
      transitionTimingFunction: {
        trading: 'var(--ease)',
      },
      transitionDuration: {
        fast:    'var(--dur-fast)',
        trading: 'var(--dur)',
        slow:    'var(--dur-slow)',
      },
    },
  },
};

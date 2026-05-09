/**
 * @file step-indicator.tsx
 * @module web
 * @description Vertical progress bar with colored step circles for onboarding.
 * @author BharatERP
 * @created 2026-04-16
 */

import type { OnboardingStep, StepStatus } from '../lib/types';

const STATUS_RING: Record<StepStatus, string> = {
  COMPLETE: 'border-[var(--bull)] bg-[var(--bull)]',
  IN_PROGRESS: 'border-[var(--accent)] bg-[var(--accent)] animate-pulse',
  PENDING: 'border-obsidian-border bg-obsidian-muted',
  REJECTED: 'border-[var(--bear)] bg-[var(--bear)]',
};

const STATUS_ICON: Record<StepStatus, string> = {
  COMPLETE: '\u2713',
  IN_PROGRESS: '\u2022',
  PENDING: '',
  REJECTED: '\u2717',
};

export function StepIndicator({
  steps,
  activeId,
  onSelect,
}: {
  steps: OnboardingStep[];
  activeId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="flex flex-col" data-testid="step-indicator">
      {steps.map((step, i) => (
        <div key={step.id} className="flex gap-3">
          <div className="flex flex-col items-center">
            <button
              data-testid={`step-circle-${step.id}`}
              onClick={() => onSelect(step.id)}
              className={`flex h-7 w-7 items-center justify-center rounded-full border-2 text-xs font-bold text-white ${STATUS_RING[step.status]} ${
                activeId === step.id ? 'ring-2 ring-[var(--accent)] ring-offset-2 ring-offset-obsidian-canvas' : ''
              }`}
            >
              {STATUS_ICON[step.status]}
            </button>
            {i < steps.length - 1 && (
              <div className={`w-0.5 grow ${step.status === 'COMPLETE' ? 'bg-[var(--bull)]' : 'bg-obsidian-border'}`} style={{ minHeight: 32 }} />
            )}
          </div>
          <button
            onClick={() => onSelect(step.id)}
            className={`pb-6 text-left ${activeId === step.id ? 'text-obsidian-primary' : 'text-obsidian-secondary'}`}
          >
            <p className="text-sm font-medium">{step.title}</p>
            <p className="text-xs text-obsidian-faint">{step.status.replace('_', ' ')}</p>
          </button>
        </div>
      ))}
    </div>
  );
}

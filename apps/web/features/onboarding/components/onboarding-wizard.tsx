/**
 * @file onboarding-wizard.tsx
 * @module web
 * @description Multi-step KYC onboarding wizard with step indicator and detail panel.
 * @author BharatERP
 * @created 2026-04-16
 */

'use client';

import { useState } from 'react';
import { BROKER_PROFILE, KYC_DOCUMENTS, ONBOARDING_STEPS } from '../lib/mock-data';
import { StepIndicator } from './step-indicator';
import { StepDetail } from './step-detail';

export function OnboardingWizard() {
  const [activeStepId, setActiveStepId] = useState(
    ONBOARDING_STEPS.find((s) => s.status === 'IN_PROGRESS')?.id ?? ONBOARDING_STEPS[0].id,
  );

  const activeStep = ONBOARDING_STEPS.find((s) => s.id === activeStepId) ?? ONBOARDING_STEPS[0];

  const completedCount = ONBOARDING_STEPS.filter((s) => s.status === 'COMPLETE').length;

  return (
    <div className="flex flex-col gap-6" data-testid="onboarding-wizard">
      <div className="flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-obsidian-muted">
          <div
            className="h-full rounded-full bg-[var(--bull)] transition-all"
            style={{ width: `${(completedCount / ONBOARDING_STEPS.length) * 100}%` }}
          />
        </div>
        <span className="text-xs font-mono text-obsidian-secondary">
          {completedCount}/{ONBOARDING_STEPS.length} complete
        </span>
      </div>

      <div className="flex gap-6">
        <div className="w-64 shrink-0">
          <StepIndicator steps={ONBOARDING_STEPS} activeId={activeStepId} onSelect={setActiveStepId} />
        </div>
        <StepDetail step={activeStep} documents={KYC_DOCUMENTS} brokerProfile={BROKER_PROFILE} />
      </div>
    </div>
  );
}

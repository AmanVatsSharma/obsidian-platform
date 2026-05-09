/**
 * @file step-detail.tsx
 * @module web
 * @description Detail panel showing active onboarding step info and documents.
 * @author BharatERP
 * @created 2026-04-16
 */

import { Card, CardHeader, CardTitle, CardContent } from '@obsidian/obsidian-ui';
import type { BrokerProfile, KycDocument, OnboardingStep } from '../lib/types';
import { DocumentList } from './document-list';

const STATUS_LABEL: Record<string, string> = {
  COMPLETE: 'Completed',
  IN_PROGRESS: 'In Progress',
  PENDING: 'Not Started',
  REJECTED: 'Rejected',
};

const STATUS_COLOR: Record<string, string> = {
  COMPLETE: 'text-[var(--bull)]',
  IN_PROGRESS: 'text-[var(--accent)]',
  PENDING: 'text-obsidian-faint',
  REJECTED: 'text-[var(--bear)]',
};

export function StepDetail({
  step,
  documents,
  brokerProfile,
}: {
  step: OnboardingStep;
  documents: KycDocument[];
  brokerProfile: BrokerProfile;
}) {
  return (
    <Card className="flex-1" data-testid="step-detail">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{step.title}</CardTitle>
          <span className={`text-xs font-semibold ${STATUS_COLOR[step.status]}`}>
            {STATUS_LABEL[step.status]}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <p className="mb-4 text-sm text-obsidian-secondary">{step.description}</p>

        {(step.id === 'S1' || step.id === 'S2') && (
          <DocumentList documents={documents.filter((d) =>
            step.id === 'S1'
              ? ['PAN Card', 'Aadhaar Card'].includes(d.type)
              : d.type === 'Bank Statement'
          )} />
        )}

        {step.id === 'S3' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-obsidian-border/50 py-2">
              <span className="text-sm text-obsidian-secondary">Annual Income</span>
              <span className="font-mono text-sm">$50,000 - $100,000</span>
            </div>
            <div className="flex items-center justify-between border-b border-obsidian-border/50 py-2">
              <span className="text-sm text-obsidian-secondary">Trading Experience</span>
              <span className="font-mono text-sm">2-5 years</span>
            </div>
            <div className="flex items-center justify-between border-b border-obsidian-border/50 py-2">
              <span className="text-sm text-obsidian-secondary">Risk Appetite</span>
              <span className="font-mono text-sm">Moderate</span>
            </div>
            <p className="text-xs text-[var(--accent)]">Complete remaining fields to proceed.</p>
          </div>
        )}

        {step.id === 'S4' && (
          <p className="text-sm text-obsidian-faint">Complete previous steps to unlock bank linking.</p>
        )}

        {step.id === 'S5' && (
          <div className="space-y-2">
            <p className="text-sm text-obsidian-faint">Complete previous steps to access agreements.</p>
            <div className="rounded-obs border border-obsidian-border p-3">
              <p className="text-xs text-obsidian-secondary">Broker: {brokerProfile.brokerName}</p>
              <p className="text-xs text-obsidian-secondary">Account Type: {brokerProfile.accountType}</p>
              <p className="text-xs text-obsidian-secondary">Leverage: {brokerProfile.leverage}</p>
              <p className="text-xs text-obsidian-secondary">
                Status: <span className="text-[var(--accent)]">{brokerProfile.status.replace('_', ' ')}</span>
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

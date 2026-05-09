/**
 * @file document-list.tsx
 * @module web
 * @description KYC document list with status badges.
 * @author BharatERP
 * @created 2026-04-16
 */

import type { KycDocument } from '../lib/types';

const DOC_STATUS_STYLES: Record<string, string> = {
  VERIFIED: 'bg-[var(--bull)]/10 text-[var(--bull)]',
  PENDING: 'bg-[var(--accent)]/10 text-[var(--accent)]',
  REJECTED: 'bg-[var(--bear)]/10 text-[var(--bear)]',
};

export function DocumentList({ documents }: { documents: KycDocument[] }) {
  if (documents.length === 0) {
    return <p className="py-4 text-sm text-obsidian-faint">No documents uploaded yet.</p>;
  }

  return (
    <div className="overflow-x-auto" data-testid="document-list">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-obsidian-border text-left text-xs uppercase tracking-wider text-obsidian-faint">
            <th className="px-3 py-2">Document</th>
            <th className="px-3 py-2">File</th>
            <th className="px-3 py-2">Uploaded</th>
            <th className="px-3 py-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {documents.map((d) => (
            <tr key={d.id} className="border-b border-obsidian-border/50 hover:bg-obsidian-muted/50" data-testid={`doc-row-${d.id}`}>
              <td className="px-3 py-2 font-medium">{d.type}</td>
              <td className="px-3 py-2 font-mono text-xs text-obsidian-secondary">{d.fileName}</td>
              <td className="px-3 py-2 text-xs text-obsidian-secondary">{d.uploadedAt}</td>
              <td className="px-3 py-2">
                <span className={`inline-block rounded px-1.5 py-0.5 text-xs font-semibold ${DOC_STATUS_STYLES[d.status]}`}>
                  {d.status}
                </span>
                {d.rejectionReason && (
                  <p className="mt-0.5 text-[10px] text-[var(--bear)]">{d.rejectionReason}</p>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

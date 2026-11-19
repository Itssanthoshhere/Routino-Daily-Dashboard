'use client';
import { useEffect, useRef, useState } from 'react';
import type { HealthIssue } from '@/lib/dataHealth';
type Result = {
    issues: HealthIssue[];
    checkedAt: string;
    files: {
        total: number;
        checked: number;
        available: number;
        backedUp: number;
        unavailable: number;
        unchecked: number;
    };
};
export function DataHealth({ email }: {
    email?: string | null;
}) { const [result, setResult] = useState<Result | null>(null), [busy, setBusy] = useState(false), [error, setError] = useState(''); const account = useRef(email); useEffect(() => { account.current = email; setResult(null); setError(''); }, [email]); return <section className="mt-4 rounded-xl border border-line p-4 text-xs"><h4 className="font-semibold">Data health check</h4><p className="mt-2 text-muted">Inspect database-saved records for missing dates, duplicate IDs, external links, and attachment availability. Up to 50 private files are checked per run. Review suggestions only; this does not modify or delete records. Sync local edits first.</p><button type="button" disabled={busy || !email} className="btn-theme mt-3 rounded-lg border border-line px-3 py-2" onClick={async () => { const original = email; setBusy(true); setError(''); try {
    const response = await fetch('/api/data-health', { cache: 'no-store', signal: AbortSignal.timeout(45000) });
    const data = await response.json();
    if (!response.ok)
        throw new Error(data.error);
    if (account.current === original)
        setResult(data);
}
catch (e) {
    if (account.current === original)
        setError(e instanceof Error ? e.message : 'Check failed.');
}
finally {
    setBusy(false);
} }}>{busy ? 'Checking…' : 'Check saved data'}</button>{error && <p role="alert" className="mt-2 text-red-700">{error}</p>}{result && <div className="mt-3"><p>{result.files.available} originals available · {result.files.backedUp} available from backup · {result.files.unavailable} not confirmed · {result.files.unchecked} unchecked</p><p className="mt-1 text-muted">Checked {new Date(result.checkedAt).toLocaleString()}</p><ul className="mt-2 max-h-60 divide-y divide-line overflow-auto">{result.issues.map(issue => <li key={issue.id} className="py-2"><strong>{issue.level === 'warning' ? 'Needs attention: ' : ''}{issue.title}</strong><p className="mt-1 text-muted">{issue.detail}</p></li>)}</ul>{!result.issues.length && <p className="mt-2">No issues found in the records checked.</p>}</div>}</section>; }

'use client';

import { useState } from 'react';
import { apiFetch } from '@/lib/api';
import { WriScoreBreakdown } from '@/components/wri-score-breakdown';

interface PublicCheckResult {
  domain: string;
  score: number;
  checks: Array<{ category: string; key: string; value: number; weight: number }>;
}

const RATE_LIMIT_MESSAGE = 'Muitas checagens em pouco tempo, tente novamente em instantes.';

export default function HomePage() {
  const [domain, setDomain] = useState('');
  const [result, setResult] = useState<PublicCheckResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setResult(null);
    try {
      const data = await apiFetch<PublicCheckResult>('/public/wri-check', {
        method: 'POST',
        body: JSON.stringify({ domain }),
      });
      setResult(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro inesperado';
      setError(message.includes('ThrottlerException') ? RATE_LIMIT_MESSAGE : message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-4 py-10">
      <h1 className="mb-1 text-2xl font-semibold">WebKeeper Rank</h1>
      <p className="mb-6 text-sm text-white/60">Digite um site e veja o WRI Score na hora</p>

      <form onSubmit={handleSubmit} className="w-full max-w-sm">
        <input
          className="mb-3 w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm outline-none focus:border-[var(--wk-primary)]"
          placeholder="dominio.com.br"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          required
        />
        <button
          type="submit"
          disabled={loading || !domain}
          className="mb-4 w-full rounded-lg bg-[var(--wk-primary)] px-3 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
        >
          {loading ? 'Analisando...' : 'Analisar'}
        </button>
      </form>

      {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

      {result && (
        <div className="w-full max-w-sm rounded-xl border border-white/10 bg-[var(--wk-surface)] p-6">
          <WriScoreBreakdown score={result.score} checks={result.checks} />
          <div className="mt-4 border-t border-white/10 pt-4 text-center">
            <p className="mb-2 text-sm text-white/70">
              Crie uma conta para salvar esse resultado e acompanhar ao longo do tempo
            </p>
            <a href="/login" className="text-sm font-medium text-[var(--wk-primary)] hover:underline">
              Criar conta
            </a>
          </div>
        </div>
      )}
    </main>
  );
}

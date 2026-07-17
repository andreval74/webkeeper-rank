'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';

interface Project {
  id: string;
  domain: string;
}

interface Company {
  id: string;
  name: string;
  projects: Project[];
}

interface WriScore {
  id: string;
  score: number;
  createdAt: string;
  breakdown: Array<{ category: string; key: string; value: number; weight: number }>;
}

export default function DashboardPage() {
  const router = useRouter();
  const { token, user, logout } = useAuthStore();
  const queryClient = useQueryClient();

  const [companyName, setCompanyName] = useState('');
  const [domain, setDomain] = useState('');
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  useEffect(() => {
    if (!token) router.push('/login');
  }, [token, router]);

  const companiesQuery = useQuery({
    queryKey: ['companies'],
    queryFn: () => apiFetch<Company[]>('/companies', { token: token! }),
    enabled: !!token,
  });

  const scoreQuery = useQuery({
    queryKey: ['wri-latest', selectedProjectId],
    queryFn: () =>
      apiFetch<WriScore | null>(`/projects/${selectedProjectId}/wri/latest`, { token: token! }),
    enabled: !!token && !!selectedProjectId,
  });

  const createCompany = useMutation({
    mutationFn: () =>
      apiFetch<Company>('/companies', {
        method: 'POST',
        token: token!,
        body: JSON.stringify({ name: companyName }),
      }),
    onSuccess: () => {
      setCompanyName('');
      queryClient.invalidateQueries({ queryKey: ['companies'] });
    },
  });

  const createProject = useMutation({
    mutationFn: () =>
      apiFetch<Project>('/companies/projects', {
        method: 'POST',
        token: token!,
        body: JSON.stringify({ companyId: selectedCompanyId, domain }),
      }),
    onSuccess: () => {
      setDomain('');
      queryClient.invalidateQueries({ queryKey: ['companies'] });
    },
  });

  const runAudit = useMutation({
    mutationFn: () =>
      apiFetch(`/projects/${selectedProjectId}/wri/audit`, { method: 'POST', token: token! }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['wri-latest', selectedProjectId] }),
  });

  if (!token) return null;

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">WebKeeper Rank</h1>
          <p className="text-sm text-white/60">Olá, {user?.name}</p>
        </div>
        <button
          onClick={() => {
            logout();
            router.push('/login');
          }}
          className="text-sm text-white/60 hover:text-white"
        >
          Sair
        </button>
      </header>

      <section className="mb-8 rounded-xl border border-white/10 bg-[var(--wk-surface)] p-6">
        <h2 className="mb-4 text-lg font-medium">Nova empresa</h2>
        <div className="flex gap-2">
          <input
            className="flex-1 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm outline-none focus:border-[var(--wk-primary)]"
            placeholder="Nome da empresa"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
          />
          <button
            onClick={() => createCompany.mutate()}
            disabled={!companyName || createCompany.isPending}
            className="rounded-lg bg-[var(--wk-primary)] px-4 py-2 text-sm font-medium disabled:opacity-50"
          >
            Criar
          </button>
        </div>
      </section>

      <section className="mb-8 rounded-xl border border-white/10 bg-[var(--wk-surface)] p-6">
        <h2 className="mb-4 text-lg font-medium">Empresas e projetos</h2>
        {companiesQuery.isLoading && <p className="text-sm text-white/60">Carregando...</p>}
        <div className="space-y-4">
          {companiesQuery.data?.map((company) => (
            <div key={company.id} className="rounded-lg border border-white/10 p-4">
              <p className="mb-2 font-medium">{company.name}</p>
              <ul className="mb-3 space-y-1">
                {company.projects.map((project) => (
                  <li key={project.id}>
                    <button
                      onClick={() => setSelectedProjectId(project.id)}
                      className={`text-sm underline-offset-2 hover:underline ${
                        selectedProjectId === project.id ? 'text-[var(--wk-primary)]' : 'text-white/70'
                      }`}
                    >
                      {project.domain}
                    </button>
                  </li>
                ))}
              </ul>
              <div className="flex gap-2">
                <input
                  className="flex-1 rounded-lg border border-white/10 bg-black/20 px-3 py-1.5 text-sm outline-none focus:border-[var(--wk-primary)]"
                  placeholder="dominio.com.br"
                  value={selectedCompanyId === company.id ? domain : ''}
                  onFocus={() => setSelectedCompanyId(company.id)}
                  onChange={(e) => setDomain(e.target.value)}
                />
                <button
                  onClick={() => {
                    setSelectedCompanyId(company.id);
                    createProject.mutate();
                  }}
                  disabled={!domain || createProject.isPending}
                  className="rounded-lg border border-white/20 px-3 py-1.5 text-sm disabled:opacity-50"
                >
                  Adicionar domínio
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {selectedProjectId && (
        <section className="rounded-xl border border-white/10 bg-[var(--wk-surface)] p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-medium">WRI Score</h2>
            <button
              onClick={() => runAudit.mutate()}
              disabled={runAudit.isPending}
              className="rounded-lg bg-[var(--wk-primary)] px-4 py-2 text-sm font-medium disabled:opacity-50"
            >
              {runAudit.isPending ? 'Auditando...' : 'Rodar auditoria'}
            </button>
          </div>

          {scoreQuery.data ? (
            <div>
              <p className="mb-3 text-4xl font-bold text-[var(--wk-primary)]">
                {scoreQuery.data.score}
                <span className="text-base font-normal text-white/50">/100</span>
              </p>
              <ul className="space-y-1 text-sm text-white/70">
                {scoreQuery.data.breakdown?.map((check) => (
                  <li key={`${check.category}-${check.key}`}>
                    [{check.category}] {check.key}: {check.value ? '✅' : '❌'}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-sm text-white/60">Nenhuma auditoria rodada ainda.</p>
          )}
        </section>
      )}
    </main>
  );
}

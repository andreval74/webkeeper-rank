import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../test/test-utils';
import { useAuthStore } from '@/lib/auth-store';
import { apiFetch } from '@/lib/api';
import DashboardPage from './page';

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock('@/lib/api', () => ({ apiFetch: vi.fn() }));
const mockedApiFetch = vi.mocked(apiFetch);

function seedSession() {
  useAuthStore.setState({ token: 'tok123', user: { id: 'u1', email: 'a@b.com', name: 'Ana' } });
}

describe('DashboardPage', () => {
  beforeEach(() => {
    mockedApiFetch.mockReset();
    seedSession();
  });

  it('renders companies and projects from the companies query', async () => {
    mockedApiFetch.mockImplementation((path: string) => {
      if (path === '/companies') {
        return Promise.resolve([
          { id: 'c1', name: 'Acme', projects: [{ id: 'p1', domain: 'acme.com' }] },
        ]);
      }
      return Promise.resolve(null);
    });

    renderWithProviders(<DashboardPage />);

    expect(await screen.findByText('Acme')).toBeInTheDocument();
    expect(screen.getByText('acme.com')).toBeInTheDocument();
  });

  it('creates a company and the list refetches with it included', async () => {
    let companies: Array<{ id: string; name: string; projects: unknown[] }> = [];
    mockedApiFetch.mockImplementation((path: string, options?: { method?: string; body?: BodyInit | null }) => {
      if (path === '/companies' && options?.method === 'POST') {
        const { name } = JSON.parse(options.body as string);
        companies = [...companies, { id: 'c2', name, projects: [] }];
        return Promise.resolve(companies[companies.length - 1]);
      }
      if (path === '/companies') return Promise.resolve(companies);
      return Promise.resolve(null);
    });

    renderWithProviders(<DashboardPage />);
    const user = userEvent.setup();

    await user.type(screen.getByPlaceholderText('Nome da empresa'), 'Beta');
    await user.click(screen.getByRole('button', { name: 'Criar' }));

    expect(await screen.findByText('Beta')).toBeInTheDocument();
  });

  it('runs an audit for the selected project and displays the refetched score', async () => {
    let latestScore: { id: string; score: number; breakdown: unknown[] } | null = null;
    mockedApiFetch.mockImplementation((path: string, options?: { method?: string }) => {
      if (path === '/companies') {
        return Promise.resolve([
          { id: 'c1', name: 'Acme', projects: [{ id: 'p1', domain: 'acme.com' }] },
        ]);
      }
      if (path === '/projects/p1/wri/audit' && options?.method === 'POST') {
        latestScore = {
          id: 's1',
          score: 83,
          breakdown: [{ category: 'Security', key: 'https', value: 1, weight: 30 }],
        };
        return Promise.resolve(latestScore);
      }
      if (path === '/projects/p1/wri/latest') return Promise.resolve(latestScore);
      return Promise.resolve(null);
    });

    renderWithProviders(<DashboardPage />);
    const user = userEvent.setup();

    await user.click(await screen.findByText('acme.com'));
    expect(await screen.findByText('Nenhuma auditoria rodada ainda.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Rodar auditoria' }));

    await waitFor(() => {
      expect(mockedApiFetch).toHaveBeenCalledWith('/projects/p1/wri/audit', {
        method: 'POST',
        token: 'tok123',
      });
    });
    expect(await screen.findByText('83')).toBeInTheDocument();
    expect(screen.getByText(/https/)).toBeInTheDocument();
  });
});

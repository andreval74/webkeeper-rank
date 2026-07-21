import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { apiFetch } from '@/lib/api';
import HomePage from './page';

vi.mock('@/lib/api', () => ({ apiFetch: vi.fn() }));
const mockedApiFetch = vi.mocked(apiFetch);

describe('HomePage', () => {
  beforeEach(() => {
    mockedApiFetch.mockReset();
  });

  it('roda a checagem e mostra o score com o CTA de cadastro', async () => {
    mockedApiFetch.mockResolvedValueOnce({
      domain: 'acme.com',
      score: 83,
      checks: [{ category: 'Security', key: 'https', value: 1, weight: 4.29 }],
    });
    render(<HomePage />);
    const user = userEvent.setup();

    await user.type(screen.getByPlaceholderText('dominio.com.br'), 'acme.com');
    await user.click(screen.getByRole('button', { name: 'Analisar' }));

    await waitFor(() => {
      expect(mockedApiFetch).toHaveBeenCalledWith('/public/wri-check', {
        method: 'POST',
        body: JSON.stringify({ domain: 'acme.com' }),
      });
    });
    expect(await screen.findByText('83')).toBeInTheDocument();
    expect(screen.getByText('Criar conta')).toBeInTheDocument();
  });

  it('mostra a mensagem de rate limit quando o backend recusa por excesso de checagens', async () => {
    mockedApiFetch.mockRejectedValueOnce(new Error('ThrottlerException: Too Many Requests'));
    render(<HomePage />);
    const user = userEvent.setup();

    await user.type(screen.getByPlaceholderText('dominio.com.br'), 'acme.com');
    await user.click(screen.getByRole('button', { name: 'Analisar' }));

    expect(
      await screen.findByText('Muitas checagens em pouco tempo, tente novamente em instantes.'),
    ).toBeInTheDocument();
  });

  it('mostra a mensagem de erro do backend para domínio inválido', async () => {
    mockedApiFetch.mockRejectedValueOnce(new Error('Domínio inválido para checagem pública'));
    render(<HomePage />);
    const user = userEvent.setup();

    await user.type(screen.getByPlaceholderText('dominio.com.br'), 'localhost');
    await user.click(screen.getByRole('button', { name: 'Analisar' }));

    expect(await screen.findByText('Domínio inválido para checagem pública')).toBeInTheDocument();
  });
});

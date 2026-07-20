import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../test/test-utils';
import { useAuthStore } from '@/lib/auth-store';
import { apiFetch } from '@/lib/api';
import LoginPage from './page';

const { mockPush } = vi.hoisted(() => ({ mockPush: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: mockPush }) }));
vi.mock('@/lib/api', () => ({ apiFetch: vi.fn() }));
const mockedApiFetch = vi.mocked(apiFetch);

describe('LoginPage', () => {
  beforeEach(() => {
    mockedApiFetch.mockReset();
    mockPush.mockReset();
  });

  it('logs in with valid credentials, stores the session, and navigates to /dashboard', async () => {
    mockedApiFetch.mockResolvedValueOnce({
      accessToken: 'tok123',
      user: { id: 'u1', email: 'a@b.com', name: 'Ana' },
    });
    renderWithProviders(<LoginPage />);
    const user = userEvent.setup();

    await user.type(screen.getByPlaceholderText('E-mail'), 'a@b.com');
    await user.type(screen.getByPlaceholderText('Senha'), 'secret1');
    await user.click(screen.getByRole('button', { name: 'Entrar' }));

    await waitFor(() => {
      expect(mockedApiFetch).toHaveBeenCalledWith('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: 'a@b.com', password: 'secret1' }),
      });
    });
    expect(useAuthStore.getState().token).toBe('tok123');
    expect(mockPush).toHaveBeenCalledWith('/dashboard');
  });

  it('shows an error and does not navigate on invalid credentials', async () => {
    mockedApiFetch.mockRejectedValueOnce(new Error('Credenciais inválidas'));
    renderWithProviders(<LoginPage />);
    const user = userEvent.setup();

    await user.type(screen.getByPlaceholderText('E-mail'), 'a@b.com');
    await user.type(screen.getByPlaceholderText('Senha'), 'wrong');
    await user.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByText('Credenciais inválidas')).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
    expect(useAuthStore.getState().token).toBeNull();
  });
});

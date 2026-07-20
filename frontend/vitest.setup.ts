import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import { useAuthStore } from './lib/auth-store';

afterEach(() => {
  cleanup();
  localStorage.clear();
  useAuthStore.setState({ token: null, user: null });
});

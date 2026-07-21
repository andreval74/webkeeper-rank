import { isPubliclyRoutableHostname } from './public-domain-guard.util';

describe('isPubliclyRoutableHostname', () => {
  it('aceita um domínio público comum', () => {
    expect(isPubliclyRoutableHostname('acme.com')).toBe(true);
  });

  it('aceita um domínio já com prefixo https://', () => {
    expect(isPubliclyRoutableHostname('https://acme.com.br')).toBe(true);
  });

  it('rejeita um IPv4 literal', () => {
    expect(isPubliclyRoutableHostname('127.0.0.1')).toBe(false);
  });

  it('rejeita "localhost"', () => {
    expect(isPubliclyRoutableHostname('localhost')).toBe(false);
  });

  it('rejeita hostname sem TLD (label único)', () => {
    expect(isPubliclyRoutableHostname('internal-service')).toBe(false);
  });

  it('rejeita string que não é uma URL válida', () => {
    expect(isPubliclyRoutableHostname('http://')).toBe(false);
  });
});

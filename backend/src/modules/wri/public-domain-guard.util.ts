const IPV4_PATTERN = /^(\d{1,3}\.){3}\d{1,3}$/;
const RESERVED_HOSTNAMES = new Set(['localhost']);
const RESERVED_SUFFIXES = ['.localhost', '.local', '.internal', '.test', '.example', '.invalid'];

function extractHostname(rawInput: string): string | null {
  const withScheme =
    rawInput.startsWith('http://') || rawInput.startsWith('https://')
      ? rawInput
      : `https://${rawInput}`;
  try {
    return new URL(withScheme).hostname;
  } catch {
    return null;
  }
}

export function isPubliclyRoutableHostname(rawInput: string): boolean {
  const hostname = extractHostname(rawInput);
  if (!hostname) return false;

  const lower = hostname.toLowerCase();

  if (RESERVED_HOSTNAMES.has(lower)) return false;
  if (RESERVED_SUFFIXES.some((suffix) => lower.endsWith(suffix))) return false;
  if (IPV4_PATTERN.test(lower)) return false;
  if (lower.includes(':')) return false;
  if (!lower.includes('.')) return false;

  return true;
}

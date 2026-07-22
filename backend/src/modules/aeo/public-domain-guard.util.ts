export function isPubliclyRoutableHostname(hostname: string): boolean {
  if (!hostname || typeof hostname !== 'string') return false;

  hostname = hostname.toLowerCase().trim();
  if (hostname.startsWith('http://') || hostname.startsWith('https://')) {
    try {
      const url = new URL(hostname);
      hostname = url.hostname;
    } catch {
      return false;
    }
  }

  if (hostname === 'localhost' || hostname.startsWith('127.') || hostname === '[::1]') {
    return false;
  }

  const ipv4Pattern = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;
  if (ipv4Pattern.test(hostname)) {
    const parts = hostname.split('.').map(Number);
    if (parts[0] === 10 || parts[0] === 172 || parts[0] === 192 || parts[0] === 169) {
      return false;
    }
  }

  if (hostname.startsWith('[') || hostname.includes(':')) {
    return false;
  }

  if (!hostname.includes('.')) {
    return false;
  }

  return true;
}

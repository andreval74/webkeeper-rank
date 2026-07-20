import * as tls from 'node:tls';

export interface AuditCheck {
  category: 'Security' | 'Performance' | 'SEO';
  key: string;
  value: number;
  weight: number;
}

export interface AuditResult {
  domain: string;
  score: number;
  checks: AuditCheck[];
}

type RawCheck = Omit<AuditCheck, 'weight'>;

const CATEGORY_TOTAL: Record<AuditCheck['category'], number> = {
  Security: 30,
  Performance: 30,
  SEO: 40,
};

const NETWORK_TIMEOUT_MS = 8000;
const RESPONSE_TIME_THRESHOLD_MS = 2000;

function normalizeDomain(domain: string): string {
  return domain.startsWith('http://') || domain.startsWith('https://')
    ? domain
    : `https://${domain}`;
}

function extractTag(html: string, pattern: RegExp): boolean {
  return pattern.test(html);
}

export function assignWeights(rawChecks: RawCheck[]): AuditCheck[] {
  const counts = new Map<AuditCheck['category'], number>();
  for (const check of rawChecks) {
    counts.set(check.category, (counts.get(check.category) ?? 0) + 1);
  }

  for (const category of Object.keys(CATEGORY_TOTAL) as AuditCheck['category'][]) {
    if (!counts.get(category)) {
      throw new Error(`Categoria de auditoria sem checks: ${category}`);
    }
  }

  return rawChecks.map((check) => ({
    ...check,
    weight: CATEGORY_TOTAL[check.category] / (counts.get(check.category) ?? 1),
  }));
}

export function calculateScore(checks: AuditCheck[]): number {
  const totalWeight = checks.reduce((sum, c) => sum + c.weight, 0);
  const weightedScore = checks.reduce((sum, c) => sum + c.value * c.weight, 0);
  return Math.round((weightedScore / totalWeight) * 100);
}

function checkSecurityHeaders(headers: Headers): RawCheck[] {
  const has = (name: string) => (headers.get(name) !== null ? 1 : 0);
  return [
    { category: 'Security', key: 'csp', value: has('content-security-policy') },
    { category: 'Security', key: 'hsts', value: has('strict-transport-security') },
    { category: 'Security', key: 'x_frame_options', value: has('x-frame-options') },
    { category: 'Security', key: 'x_content_type_options', value: has('x-content-type-options') },
    { category: 'Security', key: 'referrer_policy', value: has('referrer-policy') },
  ];
}

function checkSslCertificate(hostname: string, usesHttps: boolean): Promise<RawCheck> {
  if (!usesHttps) {
    return Promise.resolve({ category: 'Security', key: 'ssl_cert_valid', value: 0 });
  }

  return new Promise((resolve) => {
    let settled = false;
    const settle = (value: number) => {
      if (settled) return;
      settled = true;
      resolve({ category: 'Security', key: 'ssl_cert_valid', value });
    };

    const socket = tls.connect(
      { host: hostname, port: 443, servername: hostname, timeout: NETWORK_TIMEOUT_MS },
      () => {
        settle(1);
        socket.end();
      },
    );
    socket.on('error', () => settle(0));
    socket.on('timeout', () => {
      settle(0);
      socket.destroy();
    });
  });
}

async function checkPathAvailable(origin: string, path: string, key: string): Promise<RawCheck> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), NETWORK_TIMEOUT_MS);
  try {
    const response = await fetch(`${origin}${path}`, { signal: controller.signal });
    const contentType = response.headers.get('content-type') ?? '';
    const looksLikeSpaFallback = contentType.toLowerCase().startsWith('text/html');
    const value = response.ok && !looksLikeSpaFallback ? 1 : 0;
    return { category: 'SEO', key, value };
  } catch {
    return { category: 'SEO', key, value: 0 };
  } finally {
    clearTimeout(timeout);
  }
}

export function checkStructuredData(html: string): RawCheck {
  const matches = html.matchAll(
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  );
  for (const match of matches) {
    try {
      JSON.parse(match[1]);
      return { category: 'SEO', key: 'structured_data_jsonld', value: 1 };
    } catch {
      // tenta o próximo <script> ld+json, se houver
    }
  }
  return { category: 'SEO', key: 'structured_data_jsonld', value: 0 };
}

export function checkResponseTime(durationMs: number): RawCheck {
  return {
    category: 'Performance',
    key: 'response_time',
    value: durationMs <= RESPONSE_TIME_THRESHOLD_MS ? 1 : 0,
  };
}

export async function runDeterministicAudit(domain: string): Promise<AuditResult> {
  const url = normalizeDomain(domain);

  let usesHttps = url.startsWith('https://');
  let html = '';
  let responded = false;
  let headers: Headers = new Headers();
  let origin = url;
  let hostname = domain;
  let durationMs = 0;

  const startedAt = Date.now();
  try {
    const response = await fetch(url, { redirect: 'follow' });
    durationMs = Date.now() - startedAt;
    responded = response.ok;
    usesHttps = response.url.startsWith('https://');
    headers = response.headers;
    html = await response.text();

    const resolvedUrl = new URL(response.url);
    origin = resolvedUrl.origin;
    hostname = resolvedUrl.hostname;
  } catch {
    durationMs = Date.now() - startedAt;
    responded = false;
  }

  const [sslCheck, robotsCheck, sitemapCheck] = await Promise.all([
    checkSslCertificate(hostname, usesHttps),
    checkPathAvailable(origin, '/robots.txt', 'robots_txt'),
    checkPathAvailable(origin, '/sitemap.xml', 'sitemap_xml'),
  ]);

  const rawChecks: RawCheck[] = [
    { category: 'Security', key: 'https', value: usesHttps ? 1 : 0 },
    sslCheck,
    ...checkSecurityHeaders(headers),
    { category: 'Performance', key: 'reachable', value: responded ? 1 : 0 },
    checkResponseTime(durationMs),
    {
      category: 'SEO',
      key: 'title_tag',
      value: extractTag(html, /<title>[^<]{5,}<\/title>/i) ? 1 : 0,
    },
    {
      category: 'SEO',
      key: 'meta_description',
      value: extractTag(html, /<meta[^>]+name=["']description["'][^>]*>/i) ? 1 : 0,
    },
    robotsCheck,
    sitemapCheck,
    checkStructuredData(html),
  ];

  const checks = assignWeights(rawChecks);
  const score = calculateScore(checks);

  return { domain, score, checks };
}

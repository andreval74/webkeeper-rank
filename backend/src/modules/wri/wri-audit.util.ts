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

function normalizeDomain(domain: string): string {
  return domain.startsWith('http://') || domain.startsWith('https://')
    ? domain
    : `https://${domain}`;
}

function extractTag(html: string, pattern: RegExp): boolean {
  return pattern.test(html);
}

export async function runDeterministicAudit(domain: string): Promise<AuditResult> {
  const url = normalizeDomain(domain);
  const checks: AuditCheck[] = [];

  let usesHttps = url.startsWith('https://');
  let html = '';
  let responded = false;

  try {
    const response = await fetch(url, { redirect: 'follow' });
    responded = response.ok;
    usesHttps = response.url.startsWith('https://');
    html = await response.text();
  } catch {
    responded = false;
  }

  checks.push({ category: 'Security', key: 'https', value: usesHttps ? 1 : 0, weight: 30 });
  checks.push({ category: 'Performance', key: 'reachable', value: responded ? 1 : 0, weight: 30 });
  checks.push({
    category: 'SEO',
    key: 'title_tag',
    value: extractTag(html, /<title>[^<]{5,}<\/title>/i) ? 1 : 0,
    weight: 20,
  });
  checks.push({
    category: 'SEO',
    key: 'meta_description',
    value: extractTag(html, /<meta[^>]+name=["']description["'][^>]*>/i) ? 1 : 0,
    weight: 20,
  });

  const totalWeight = checks.reduce((sum, c) => sum + c.weight, 0);
  const weightedScore = checks.reduce((sum, c) => sum + c.value * c.weight, 0);
  const score = Math.round((weightedScore / totalWeight) * 100);

  return { domain, score, checks };
}

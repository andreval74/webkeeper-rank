export interface AuditCheck { category: 'LOCAL'; key: string; value: number; weight: number; }
export interface AuditResult { domain: string; score: number; checks: AuditCheck[]; }
type RawCheck = Omit<AuditCheck, 'weight'>;
export function assignWeights(rawChecks: RawCheck[]): AuditCheck[] {
  const weight = 100 / rawChecks.length;
  return rawChecks.map((c) => ({ ...c, weight }));
}
export function calculateScore(checks: AuditCheck[]): number {
  const totalWeight = checks.reduce((sum, c) => sum + c.weight, 0);
  return Math.round(checks.reduce((sum, c) => sum + c.value * c.weight, 0) / totalWeight * 100);
}
export async function runDeterministicLocalAudit(domain: string): Promise<AuditResult> {
  const url = domain.startsWith('http') ? domain : `https://${domain}`;
  let html = '';
  try {
    const c = new AbortController();
    const t = setTimeout(() => c.abort(), 8000);
    const r = await fetch(url, { redirect: 'follow', signal: c.signal });
    clearTimeout(t);
    html = await r.text();
  } catch {
    // fetch falhou
  }
  const checks = assignWeights([
    { category: 'LOCAL', key: 'google_business', value: /google business|google places|gmb/i.test(html) ? 1 : 0 },
    { category: 'LOCAL', key: 'local_schema', value: /"LocalBusiness"|"address"|"telephone"|"geo"/i.test(html) ? 1 : 0 },
    { category: 'LOCAL', key: 'address_present', value: /address|phone|zip code|city|state/i.test(html) ? 1 : 0 },
    { category: 'LOCAL', key: 'phone_number', value: /<a[^>]*href=["']tel:/i.test(html) ? 1 : 0 },
    { category: 'LOCAL', key: 'opening_hours', value: /hours|open|close|monday|tuesday/i.test(html) ? 1 : 0 },
    { category: 'LOCAL', key: 'map_integration', value: /google maps|map|location|coordinates/i.test(html) ? 1 : 0 },
    { category: 'LOCAL', key: 'local_citations', value: /yelp|yellowpages|directory|listing/i.test(html) ? 1 : 0 },
    { category: 'LOCAL', key: 'review_links', value: /leave.*review|write.*review|rate|google review/i.test(html) ? 1 : 0 },
  ]);
  return { domain, score: calculateScore(checks), checks };
}

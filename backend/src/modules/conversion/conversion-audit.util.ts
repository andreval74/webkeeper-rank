export interface AuditCheck { category: 'CONVERSION'; key: string; value: number; weight: number; }
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
export async function runDeterministicConversionAudit(domain: string): Promise<AuditResult> {
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
    { category: 'CONVERSION', key: 'cta_buttons', value: /<(?:a|button)[^>]*class=["'][^"']*(?:cta|btn|button|action)["']/i.test(html) ? 1 : 0 },
    { category: 'CONVERSION', key: 'contact_form', value: /<form[^>]*>[\s\S]*?<input[^>]*type=["'](?:email|submit)/i.test(html) ? 1 : 0 },
    { category: 'CONVERSION', key: 'trust_signals', value: /ssl|secure|trusted|verified|guarantee/i.test(html) ? 1 : 0 },
    { category: 'CONVERSION', key: 'pricing_info', value: /price|pricing|cost|free|trial|plan/i.test(html) ? 1 : 0 },
    { category: 'CONVERSION', key: 'testimonials', value: /testimonial|review|customer|feedback|quote/i.test(html) ? 1 : 0 },
    { category: 'CONVERSION', key: 'urgency_elements', value: /limited|offer|discount|sale|exclusive|today/i.test(html) ? 1 : 0 },
    { category: 'CONVERSION', key: 'video_content', value: /<(?:video|iframe)[^>]*(?:youtube|vimeo)/i.test(html) ? 1 : 0 },
    { category: 'CONVERSION', key: 'analytics_tracking', value: /google.*analytics|gtag|ga\(|_gaq/i.test(html) ? 1 : 0 },
  ]);
  return { domain, score: calculateScore(checks), checks };
}

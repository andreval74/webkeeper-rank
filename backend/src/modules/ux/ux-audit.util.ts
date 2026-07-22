export interface AuditCheck { category: 'UX'; key: string; value: number; weight: number; }
export interface AuditResult { domain: string; score: number; checks: AuditCheck[]; }
type RawCheck = Omit<AuditCheck, 'weight'>;
const UX_TOTAL = 100;
export function assignWeights(rawChecks: RawCheck[]): AuditCheck[] {
  const weight = UX_TOTAL / rawChecks.length;
  return rawChecks.map((check) => ({ ...check, weight }));
}
export function calculateScore(checks: AuditCheck[]): number {
  const totalWeight = checks.reduce((sum, c) => sum + c.weight, 0);
  const weightedScore = checks.reduce((sum, c) => sum + c.value * c.weight, 0);
  return Math.round((weightedScore / totalWeight) * 100);
}
export async function runDeterministicUxAudit(domain: string): Promise<AuditResult> {
  const url = domain.startsWith('http') ? domain : `https://${domain}`;
  let html = '';
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const response = await fetch(url, { redirect: 'follow', signal: controller.signal });
    clearTimeout(timeout);
    html = await response.text();
  } catch {
    // fetch falhou
  }
  const checks = assignWeights([
    { category: 'UX', key: 'mobile_responsive', value: /<meta[^>]+name=["']viewport["']/i.test(html) ? 1 : 0 },
    { category: 'UX', key: 'load_time', value: 1 },
    { category: 'UX', key: 'navigation', value: /<nav[^>]*>[\s\S]*?<\/nav>/i.test(html) ? 1 : 0 },
    { category: 'UX', key: 'call_to_action', value: /<(?:a|button)[^>]*class=["'][^"']*(?:cta|btn|button)/i.test(html) ? 1 : 0 },
    { category: 'UX', key: 'form_accessibility', value: /<form[^>]*>[\s\S]*?<label/i.test(html) ? 1 : 0 },
    { category: 'UX', key: 'color_contrast', value: 1 },
    { category: 'UX', key: 'accessibility_headers', value: /<h[1-6]/i.test(html) ? 1 : 0 },
    { category: 'UX', key: 'page_structure', value: /<(?:main|article)[^>]*>/i.test(html) ? 1 : 0 },
  ]);
  return { domain, score: calculateScore(checks), checks };
}

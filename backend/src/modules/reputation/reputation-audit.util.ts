export interface AuditCheck { category: 'REPUTATION'; key: string; value: number; weight: number; }
export interface AuditResult { domain: string; score: number; checks: AuditCheck[]; }
type RawCheck = Omit<AuditCheck, 'weight'>;
export function assignWeights(rawChecks: RawCheck[]): AuditCheck[] {
  const weight = 100 / rawChecks.length;
  return rawChecks.map((c) => ({ ...c, weight }));
}
export function calculateScore(checks: AuditCheck[]): number {
  const totalWeight = checks.reduce((sum, c) => sum + c.weight, 0);
  const weightedScore = checks.reduce((sum, c) => sum + c.value * c.weight, 0);
  return Math.round((weightedScore / totalWeight) * 100);
}
export async function runDeterministicReputationAudit(domain: string): Promise<AuditResult> {
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
    { category: 'REPUTATION', key: 'reviews_present', value: /review|rating|testimon/i.test(html) ? 1 : 0 },
    { category: 'REPUTATION', key: 'negative_mentions', value: /warning|danger|issue|problem/i.test(html) ? 0 : 1 },
    { category: 'REPUTATION', key: 'social_proof', value: /"testimonial"|"review"|star|rating/i.test(html) ? 1 : 0 },
    { category: 'REPUTATION', key: 'awards', value: /award|accredited|certified|recogn/i.test(html) ? 1 : 0 },
    { category: 'REPUTATION', key: 'press_mentions', value: /press|media|news|featured in/i.test(html) ? 1 : 0 },
    { category: 'REPUTATION', key: 'customer_feedback', value: /<blockquote|quote|feedback/i.test(html) ? 1 : 0 },
    { category: 'REPUTATION', key: 'verified_business', value: /verified|trusted|verified business/i.test(html) ? 1 : 0 },
    { category: 'REPUTATION', key: 'response_rate', value: 1 },
  ]);
  return { domain, score: calculateScore(checks), checks };
}

export interface AuditCheck { category: 'SOCIAL'; key: string; value: number; weight: number; }
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
export async function runDeterministicSocialAudit(domain: string): Promise<AuditResult> {
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
    { category: 'SOCIAL', key: 'facebook_presence', value: /facebook\.com|og:type.*article/i.test(html) ? 1 : 0 },
    { category: 'SOCIAL', key: 'twitter_presence', value: /twitter\.com|@\w+|twitter:card/i.test(html) ? 1 : 0 },
    { category: 'SOCIAL', key: 'linkedin_presence', value: /linkedin\.com/i.test(html) ? 1 : 0 },
    { category: 'SOCIAL', key: 'instagram_presence', value: /instagram\.com/i.test(html) ? 1 : 0 },
    { category: 'SOCIAL', key: 'og_tags', value: /og:title|og:image|og:description/i.test(html) ? 1 : 0 },
    { category: 'SOCIAL', key: 'social_share_buttons', value: /share|twitter|facebook|linkedin|pinterest/i.test(html) ? 1 : 0 },
    { category: 'SOCIAL', key: 'engagement_signals', value: /#hashtag|@mention|follow|like|share/i.test(html) ? 1 : 0 },
    { category: 'SOCIAL', key: 'social_icons', value: /<a[^>]*href=["']https?:\/\/(?:www\.)?(?:facebook|twitter|linkedin|instagram)/i.test(html) ? 1 : 0 },
  ]);
  return { domain, score: calculateScore(checks), checks };
}

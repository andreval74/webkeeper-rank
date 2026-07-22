export interface AuditCheck { category: 'UX'; key: string; value: number; weight: number; }
export interface AuditResult { domain: string; score: number; checks: AuditCheck[]; }
type RawCheck = Omit<AuditCheck, 'weight'>;
const UX_TOTAL = 100;
const NETWORK_TIMEOUT_MS = 8000;
function normalizeDomain(domain: string): string {
  return domain.startsWith('http://') || domain.startsWith('https://') ? domain : `https://${domain}`;
}
export function assignWeights(rawChecks: RawCheck[]): AuditCheck[] {
  const count = rawChecks.length;
  const weight = UX_TOTAL / count;
  return rawChecks.map((check) => ({ ...check, weight }));
}
export function calculateScore(checks: AuditCheck[]): number {
  const totalWeight = checks.reduce((sum, c) => sum + c.weight, 0);
  const weightedScore = checks.reduce((sum, c) => sum + c.value * c.weight, 0);
  return Math.round((weightedScore / totalWeight) * 100);
}
function checkMobileResponsive(html: string): RawCheck {
  const hasMeta = /<meta[^>]+name=["']viewport["'][^>]*>/i.test(html);
  return { category: 'UX', key: 'mobile_responsive', value: hasMeta ? 1 : 0 };
}
function checkLoadTime(): RawCheck {
  return { category: 'UX', key: 'load_time', value: 1 };
}
function checkNavigation(html: string): RawCheck {
  const hasNav = /<nav[^>]*>[\s\S]*?<\/nav>/i.test(html);
  return { category: 'UX', key: 'navigation', value: hasNav ? 1 : 0 };
}
function checkCallToAction(html: string): RawCheck {
  const hasCta = /<(?:a|button)[^>]*class=["'].*?(?:cta|btn|button|action)["'][^>]*>/i.test(html);
  return { category: 'UX', key: 'call_to_action', value: hasCta ? 1 : 0 };
}
function checkFormAccessibility(html: string): RawCheck {
  const hasForms = /<form[^>]*>[\s\S]*?<\/form>/i.test(html);
  const hasLabels = /<label[^>]*>/i.test(html);
  return { category: 'UX', key: 'form_accessibility', value: hasForms && hasLabels ? 1 : 0 };
}
function checkContrast(): RawCheck {
  return { category: 'UX', key: 'color_contrast', value: 1 };
}
function checkAccessibilityHeaders(html: string): RawCheck {
  const hasHeadings = /<h[1-6]/i.test(html);
  return { category: 'UX', key: 'accessibility_headers', value: hasHeadings ? 1 : 0 };
}
function checkPageStructure(html: string): RawCheck {
  const hasMain = /<main[^>]*>/i.test(html);
  const hasArticle = /<article[^>]*>/i.test(html);
  return { category: 'UX', key: 'page_structure', value: hasMain || hasArticle ? 1 : 0 };
}
export async function runDeterministicUxAudit(domain: string): Promise<AuditResult> {
  const url = normalizeDomain(domain);
  let html = '';
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), NETWORK_TIMEOUT_MS);
    const response = await fetch(url, { redirect: 'follow', signal: controller.signal });
    clearTimeout(timeout);
    html = await response.text();
  } catch {}
  const rawChecks: RawCheck[] = [
    checkMobileResponsive(html),
    checkLoadTime(),
    checkNavigation(html),
    checkCallToAction(html),
    checkFormAccessibility(html),
    checkContrast(),
    checkAccessibilityHeaders(html),
    checkPageStructure(html),
  ];
  const checks = assignWeights(rawChecks);
  const score = calculateScore(checks);
  return { domain, score, checks };
}

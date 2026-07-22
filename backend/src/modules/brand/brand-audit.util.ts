export interface AuditCheck {
  category: 'BRAND';
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

const BRAND_TOTAL = 100;
const NETWORK_TIMEOUT_MS = 8000;

function normalizeDomain(domain: string): string {
  return domain.startsWith('http://') || domain.startsWith('https://')
    ? domain
    : `https://${domain}`;
}

function extractTag(html: string, pattern: RegExp): boolean {
  return pattern.test(html);
}

export function assignWeights(rawChecks: RawCheck[]): AuditCheck[] {
  const count = rawChecks.length;
  const weight = BRAND_TOTAL / count;

  return rawChecks.map((check) => ({
    ...check,
    weight,
  }));
}

export function calculateScore(checks: AuditCheck[]): number {
  const totalWeight = checks.reduce((sum, c) => sum + c.weight, 0);
  const weightedScore = checks.reduce((sum, c) => sum + c.value * c.weight, 0);
  return Math.round((weightedScore / totalWeight) * 100);
}

function checkBrandConsistency(html: string): RawCheck {
  const hasLogo = extractTag(html, /<img[^>]*(?:alt=["'].*?logo|src=["'].*?logo)[^>]*>/i) ||
    extractTag(html, /class=["'].*?logo|class=["'].*?brand["']/i);
  const hasNavigation = extractTag(html, /<nav[^>]*>[\s\S]*?<\/nav>/i);
  return {
    category: 'BRAND',
    key: 'brand_consistency',
    value: hasLogo && hasNavigation ? 1 : 0,
  };
}

function checkColorConsistency(html: string): RawCheck {
  const hasCss = extractTag(html, /<link[^>]+href=["'].*?\.css["'][^>]*>|<style[^>]*>[\s\S]*?<\/style>/i);
  const hasColorVars = extractTag(html, /--color|--primary|--brand|color\s*:\s*#/i);
  return {
    category: 'BRAND',
    key: 'color_consistency',
    value: hasCss && hasColorVars ? 1 : 0,
  };
}

function checkTypographyConsistency(html: string): RawCheck {
  const hasFontImport = extractTag(html, /@import|@font-face|font-family|googleapis|fonts\./i);
  const hasHeadings = extractTag(html, /<h[1-6][^>]*>.+?<\/h[1-6]>/i);
  return {
    category: 'BRAND',
    key: 'typography_consistency',
    value: hasFontImport && hasHeadings ? 1 : 0,
  };
}

function checkBrandMessaging(html: string): RawCheck {
  const hasTagline = extractTag(html, /<(?:h1|h2|p)[^>]*>[\s\S]{10,}/i) ||
    extractTag(html, /tagline|slogan|motto|brand statement/i);
  const hasAbout = extractTag(html, /about|who we are|mission|vision/i);
  return {
    category: 'BRAND',
    key: 'brand_messaging',
    value: hasTagline && hasAbout ? 1 : 0,
  };
}

function checkSocialLinks(html: string): RawCheck {
  const socialPatterns = [
    /facebook\.com|instagram\.com|twitter\.com|linkedin\.com|youtube\.com|tiktok\.com/i,
  ];
  const hasSocialLink = socialPatterns.some((pattern) => pattern.test(html));
  const hasFooter = extractTag(html, /<footer[^>]*>[\s\S]*?<\/footer>/i);
  return {
    category: 'BRAND',
    key: 'social_links',
    value: hasSocialLink && hasFooter ? 1 : 0,
  };
}

function checkBrandGuidelines(html: string): RawCheck {
  const hasGuidelinesLink = extractTag(html, /href=["'].*?(?:brand|guideline|guide)[^"]*["']|Brand Guide|Style Guide/i);
  const hasStyleInfo = extractTag(html, /brand|identity|guideline/i);
  return {
    category: 'BRAND',
    key: 'brand_guidelines',
    value: hasGuidelinesLink || hasStyleInfo ? 1 : 0,
  };
}

function checkFaviconPresent(html: string): RawCheck {
  const hasFavicon = extractTag(html, /<link[^>]*rel=["'](?:icon|shortcut icon)["'][^>]*>/i);
  return {
    category: 'BRAND',
    key: 'favicon_present',
    value: hasFavicon ? 1 : 0,
  };
}

function checkAuthorMetadata(html: string): RawCheck {
  const hasAuthorMeta = extractTag(html, /<meta[^>]+name=["']author["'][^>]*>/i);
  const hasOrgSchema = extractTag(html, /"@type"\s*:\s*"Organization"|"name"\s*:\s*"[^"]+"|schema\.org/i);
  return {
    category: 'BRAND',
    key: 'author_metadata',
    value: hasAuthorMeta || hasOrgSchema ? 1 : 0,
  };
}

export async function runDeterministicBrandAudit(domain: string): Promise<AuditResult> {
  const url = normalizeDomain(domain);

  let html = '';

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), NETWORK_TIMEOUT_MS);
    const response = await fetch(url, { redirect: 'follow', signal: controller.signal });
    clearTimeout(timeout);

    html = await response.text();
  } catch {
    // fetch falhou, html permanece vazio
  }

  const rawChecks: RawCheck[] = [
    checkBrandConsistency(html),
    checkColorConsistency(html),
    checkTypographyConsistency(html),
    checkBrandMessaging(html),
    checkSocialLinks(html),
    checkBrandGuidelines(html),
    checkFaviconPresent(html),
    checkAuthorMetadata(html),
  ];

  const checks = assignWeights(rawChecks);
  const score = calculateScore(checks);

  return { domain, score, checks };
}

export interface AuditCheck {
  category: 'AUTHORITY';
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

const AUTHORITY_TOTAL = 100;
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
  const weight = AUTHORITY_TOTAL / count;

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

function checkSecurityCertificate(url: string): RawCheck {
  const isHttps = url.startsWith('https://');
  return {
    category: 'AUTHORITY',
    key: 'security_certificate',
    value: isHttps ? 1 : 0,
  };
}

function checkBacklinks(html: string): RawCheck {
  const hasAbout = extractTag(html, /about|who we are|company info|company profile/i);
  const hasPress = extractTag(html, /press|news|media|award|recognition/i);
  return {
    category: 'AUTHORITY',
    key: 'backlinks_indicators',
    value: hasAbout && hasPress ? 1 : 0,
  };
}

function checkAuthorCredibility(html: string): RawCheck {
  const hasAuthorMeta = extractTag(html, /<meta[^>]+name=["']author["'][^>]*>/i);
  const hasAuthorTag = extractTag(html, /rel=["']author["']|by\s+\w+|written by|author:/i);
  return {
    category: 'AUTHORITY',
    key: 'author_credibility',
    value: hasAuthorMeta || hasAuthorTag ? 1 : 0,
  };
}

function checkPublicationDates(html: string): RawCheck {
  const hasPublished = extractTag(html, /published|posted on|date|datePublished/i);
  const hasModified = extractTag(html, /updated|modified|last updated|dateModified/i);
  return {
    category: 'AUTHORITY',
    key: 'publication_dates',
    value: hasPublished || hasModified ? 1 : 0,
  };
}

function checkSourceCitations(html: string): RawCheck {
  const hasLinks = extractTag(html, /<a[^>]+href=["']https?:\/\/(?!.*same domain)[^"]+["'][^>]*>/i);
  const hasQuotes = extractTag(html, /["'"`]|<blockquote|cite/i);
  return {
    category: 'AUTHORITY',
    key: 'source_citations',
    value: hasLinks && hasQuotes ? 1 : 0,
  };
}

function checkExpertise(html: string): RawCheck {
  const hasExpertise = extractTag(html, /expert|specialist|professional|certified|degree|qualification/i);
  const hasBio = extractTag(html, /biography|profile|about the author/i);
  return {
    category: 'AUTHORITY',
    key: 'expertise_signals',
    value: hasExpertise || hasBio ? 1 : 0,
  };
}

function checkTrustSignals(html: string): RawCheck {
  const hasReviews = extractTag(html, /review|rating|testimonial|customer|client|feedback/i);
  const hasCertifications = extractTag(html, /certified|award|accredited|partner|member/i);
  return {
    category: 'AUTHORITY',
    key: 'trust_signals',
    value: hasReviews || hasCertifications ? 1 : 0,
  };
}

function checkContactInformation(html: string): RawCheck {
  const hasContact = extractTag(html, /<(?:address|div|section)[^>]*>[\s\S]*?contact[\s\S]*?<\/(?:address|div|section)>/i) ||
    extractTag(html, /email|phone|address|contact us/i);
  return {
    category: 'AUTHORITY',
    key: 'contact_information',
    value: hasContact ? 1 : 0,
  };
}

export async function runDeterministicAuthorityAudit(domain: string): Promise<AuditResult> {
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
    checkSecurityCertificate(url),
    checkBacklinks(html),
    checkAuthorCredibility(html),
    checkPublicationDates(html),
    checkSourceCitations(html),
    checkExpertise(html),
    checkTrustSignals(html),
    checkContactInformation(html),
  ];

  const checks = assignWeights(rawChecks);
  const score = calculateScore(checks);

  return { domain, score, checks };
}

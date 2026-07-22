export interface AuditCheck {
  category: 'GEO';
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

const GEO_TOTAL = 100;
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
  const weight = GEO_TOTAL / count;

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

function checkSchemaOrgCompleteness(html: string): RawCheck {
  const matches = html.matchAll(
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  );
  for (const match of matches) {
    try {
      const data = JSON.parse(match[1]) as Record<string, unknown>;
      const requiredFields = ['name', 'description', 'url', 'image'];
      const presentFields = requiredFields.filter((f) => f in data).length;
      if (presentFields >= 3) {
        return { category: 'GEO', key: 'schema_org_completeness', value: 1 };
      }
    } catch {
      // próximo JSON-LD
    }
  }
  return { category: 'GEO', key: 'schema_org_completeness', value: 0 };
}

function checkOpenGraphMetadata(html: string): RawCheck {
  const ogTags = ['og:title', 'og:description', 'og:image', 'og:url'];
  const foundTags = ogTags.filter((tag) =>
    extractTag(html, new RegExp(`<meta[^>]+property=["']${tag}["'][^>]*>`, 'i')),
  ).length;
  return {
    category: 'GEO',
    key: 'openapi_metadata',
    value: foundTags >= 3 ? 1 : 0,
  };
}

function checkEntityRecognitionTags(html: string): RawCheck {
  const hasAboutLink = extractTag(html, /href=["'].*\/about["']/i);
  const hasRelLink = extractTag(html, /rel=["']author["']/i) || extractTag(html, /rel=["']publisher["']/i);
  return {
    category: 'GEO',
    key: 'entity_recognition_tags',
    value: hasAboutLink || hasRelLink ? 1 : 0,
  };
}

function checkKnowledgeGraphEligibility(html: string, hasSchema: boolean, hasOG: boolean): RawCheck {
  const hasCanonical = extractTag(html, /<link[^>]+rel=["']canonical["'][^>]*>/i);
  return {
    category: 'GEO',
    key: 'knowledge_graph_eligible',
    value: hasSchema && hasOG && hasCanonical ? 1 : 0,
  };
}

function checkAiTrafficSignals(html: string, headers: Headers): RawCheck {
  const robotsMeta = extractTag(html, /<meta[^>]+name=["']robots["'][^>]*content=["']([^"]*)["]/, );
  const headersRobots = headers.get('x-robots-tag') ?? '';

  const allowsAi =
    !robotsMeta || // wenn kein robots meta, erlaubt
    !headersRobots.toLowerCase().includes('noai') ||
    headersRobots.toLowerCase().includes('google-extended') ||
    headersRobots.toLowerCase().includes('perplexity');

  return {
    category: 'GEO',
    key: 'ai_traffic_signals',
    value: allowsAi ? 1 : 0,
  };
}

function checkContentFreshness(html: string, headers: Headers): RawCheck {
  const lastModified = headers.get('last-modified');
  const dateModifiedMatch = html.match(
    /<meta[^>]+property=["']dateModified["'][^>]+content=["']([^"]*)["]|dateModified["'][^>]*:["']([^"]*)['"]/i,
  );

  let isRecent = false;
  const now = Date.now();
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

  if (lastModified) {
    const lastModDate = new Date(lastModified).getTime();
    isRecent = now - lastModDate <= sevenDaysMs;
  } else if (dateModifiedMatch) {
    const dateStr = dateModifiedMatch[1] || dateModifiedMatch[2];
    const modDate = new Date(dateStr).getTime();
    isRecent = !isNaN(modDate) && now - modDate <= sevenDaysMs;
  }

  return {
    category: 'GEO',
    key: 'content_freshness',
    value: isRecent ? 1 : 0,
  };
}

function checkIndexedGoogleGemini(): RawCheck {
  return {
    category: 'GEO',
    key: 'indexed_google_gemini',
    value: 1, // Stub: placeholder para futuro check com API
  };
}

function checkFeaturedInAiOverview(): RawCheck {
  return {
    category: 'GEO',
    key: 'featured_in_ai_overview',
    value: 1, // Stub: placeholder para futuro check com API
  };
}

export async function runDeterministicGeoAudit(domain: string): Promise<AuditResult> {
  const url = normalizeDomain(domain);

  let html = '';
  let headers: Headers = new Headers();

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), NETWORK_TIMEOUT_MS);
    const response = await fetch(url, { redirect: 'follow', signal: controller.signal });
    clearTimeout(timeout);

    headers = response.headers;
    html = await response.text();
  } catch {
    // fetch falhou, html e headers permanecem vazios
  }

  const schemaCheck = checkSchemaOrgCompleteness(html);
  const ogCheck = checkOpenGraphMetadata(html);

  const rawChecks: RawCheck[] = [
    checkIndexedGoogleGemini(),
    checkFeaturedInAiOverview(),
    schemaCheck,
    ogCheck,
    checkEntityRecognitionTags(html),
    checkKnowledgeGraphEligibility(html, schemaCheck.value === 1, ogCheck.value === 1),
    checkAiTrafficSignals(html, headers),
    checkContentFreshness(html, headers),
  ];

  const checks = assignWeights(rawChecks);
  const score = calculateScore(checks);

  return { domain, score, checks };
}

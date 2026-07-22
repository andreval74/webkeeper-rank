export interface AuditCheck {
  category: 'AEO';
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

const AEO_TOTAL = 100;
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
  const weight = AEO_TOTAL / count;

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

function checkSnippetOptimization(html: string): RawCheck {
  const hasMeta = extractTag(html, /<meta[^>]+name=["']description["'][^>]*>/i);
  const hasStructuredText = extractTag(html, /<p[^>]*>.{50,}/i);
  return {
    category: 'AEO',
    key: 'snippet_optimization',
    value: hasMeta && hasStructuredText ? 1 : 0,
  };
}

function checkAnswerBoxEligibility(html: string): RawCheck {
  const hasHeadings = extractTag(html, /<h[1-6][^>]*>.+?<\/h[1-6]>/i);
  const hasDirectAnswer = extractTag(html, /(<p[^>]*>.{20,100}?[.!?]<\/p>|<blockquote[^>]*>[\s\S]*?<\/blockquote>)/i);
  return {
    category: 'AEO',
    key: 'answer_box_eligibility',
    value: hasHeadings && hasDirectAnswer ? 1 : 0,
  };
}

function checkFeaturedSnippetPreparation(html: string): RawCheck {
  const hasLists = extractTag(html, /<(?:ul|ol)[^>]*>[\s\S]*?<\/(?:ul|ol)>/i);
  const hasTables = extractTag(html, /<table[^>]*>[\s\S]*?<\/table>/i);
  return {
    category: 'AEO',
    key: 'featured_snippet_preparation',
    value: hasLists || hasTables ? 1 : 0,
  };
}

function checkTableListStructure(html: string): RawCheck {
  const properLists = /(<ul[^>]*>\s*(<li[^>]*>.+?<\/li>\s*)+<\/ul>|<ol[^>]*>\s*(<li[^>]*>.+?<\/li>\s*)+<\/ol>)/i;
  const properTables = /<table[^>]*>[\s\S]*?<th[^>]*>[\s\S]*?<\/th>[\s\S]*?<td[^>]*>[\s\S]*?<\/td>[\s\S]*?<\/table>/i;
  const hasProperStructure = properLists.test(html) || properTables.test(html);
  return {
    category: 'AEO',
    key: 'table_list_structure',
    value: hasProperStructure ? 1 : 0,
  };
}

function checkInlineCodeExamples(html: string): RawCheck {
  const hasCodeBlocks = extractTag(html, /<(?:code|pre)[^>]*>[\s\S]*?<\/(?:code|pre)>/i);
  const hasCodeTags = extractTag(html, /<code[^>]*>/i);
  return {
    category: 'AEO',
    key: 'inline_code_examples',
    value: hasCodeBlocks || hasCodeTags ? 1 : 0,
  };
}

function checkDefinitionClarity(html: string): RawCheck {
  const hasDl = extractTag(html, /<dl[^>]*>[\s\S]*?<\/dl>/i);
  const hasBold = extractTag(html, /<(?:strong|b)[^>]*>/i);
  const hasEmphasis = extractTag(html, /<(?:em|i)[^>]*>/i);
  const hasDefinition = hasDl || (hasBold && hasEmphasis);
  return {
    category: 'AEO',
    key: 'definition_clarity',
    value: hasDefinition ? 1 : 0,
  };
}

function checkFaqSchema(html: string): RawCheck {
  const faqSchema = /"@type"\s*:\s*"FAQPage"|"@type"\s*:\s*"Question"|itemtype=["']https?:\/\/schema\.org\/FAQPage["']/i;
  const hasSchemaFaq = faqSchema.test(html);
  return {
    category: 'AEO',
    key: 'faq_schema',
    value: hasSchemaFaq ? 1 : 0,
  };
}

function checkPassageRelevance(html: string): RawCheck {
  const strippedHtml = html.replace(/<[^>]*>/g, ' ');
  const words = strippedHtml.split(/\s+/).length;
  const hasKeywords = extractTag(html, /<(?:h1|h2|h3|strong|b)[^>]*>.+?<\/(?:h1|h2|h3|strong|b)>/i);
  const hasRelevantLength = words > 300;
  return {
    category: 'AEO',
    key: 'passage_relevance',
    value: hasKeywords && hasRelevantLength ? 1 : 0,
  };
}

export async function runDeterministicAeoAudit(domain: string): Promise<AuditResult> {
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
    checkSnippetOptimization(html),
    checkAnswerBoxEligibility(html),
    checkFeaturedSnippetPreparation(html),
    checkTableListStructure(html),
    checkInlineCodeExamples(html),
    checkDefinitionClarity(html),
    checkFaqSchema(html),
    checkPassageRelevance(html),
  ];

  const checks = assignWeights(rawChecks);
  const score = calculateScore(checks);

  return { domain, score, checks };
}

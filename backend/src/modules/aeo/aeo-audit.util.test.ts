import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { assignWeights, calculateScore } from './aeo-audit.util';

describe('aeoAudit', () => {
  describe('assignWeights', () => {
    it('should assign equal weights to all checks', () => {
      const checks = [
        { category: 'AEO' as const, key: 'snippet_optimization', value: 1 },
        { category: 'AEO' as const, key: 'answer_box_eligibility', value: 0 },
        { category: 'AEO' as const, key: 'featured_snippet_preparation', value: 1 },
        { category: 'AEO' as const, key: 'table_list_structure', value: 1 },
        { category: 'AEO' as const, key: 'inline_code_examples', value: 0 },
        { category: 'AEO' as const, key: 'definition_clarity', value: 1 },
        { category: 'AEO' as const, key: 'faq_schema', value: 0 },
        { category: 'AEO' as const, key: 'passage_relevance', value: 1 },
      ];

      const weighted = assignWeights(checks);

      assert.equal(weighted.length, 8);
      weighted.forEach((check) => {
        assert.equal(check.weight, 12.5, `Expected weight 12.5 for ${check.key}`);
      });
    });
  });

  describe('calculateScore', () => {
    it('should calculate score as 0 when all checks fail', () => {
      const checks = [
        { category: 'AEO' as const, key: 'snippet_optimization', value: 0, weight: 12.5 },
        { category: 'AEO' as const, key: 'answer_box_eligibility', value: 0, weight: 12.5 },
        { category: 'AEO' as const, key: 'featured_snippet_preparation', value: 0, weight: 12.5 },
        { category: 'AEO' as const, key: 'table_list_structure', value: 0, weight: 12.5 },
        { category: 'AEO' as const, key: 'inline_code_examples', value: 0, weight: 12.5 },
        { category: 'AEO' as const, key: 'definition_clarity', value: 0, weight: 12.5 },
        { category: 'AEO' as const, key: 'faq_schema', value: 0, weight: 12.5 },
        { category: 'AEO' as const, key: 'passage_relevance', value: 0, weight: 12.5 },
      ];

      const score = calculateScore(checks);

      assert.equal(score, 0);
    });

    it('should calculate score as 100 when all checks pass', () => {
      const checks = [
        { category: 'AEO' as const, key: 'snippet_optimization', value: 1, weight: 12.5 },
        { category: 'AEO' as const, key: 'answer_box_eligibility', value: 1, weight: 12.5 },
        { category: 'AEO' as const, key: 'featured_snippet_preparation', value: 1, weight: 12.5 },
        { category: 'AEO' as const, key: 'table_list_structure', value: 1, weight: 12.5 },
        { category: 'AEO' as const, key: 'inline_code_examples', value: 1, weight: 12.5 },
        { category: 'AEO' as const, key: 'definition_clarity', value: 1, weight: 12.5 },
        { category: 'AEO' as const, key: 'faq_schema', value: 1, weight: 12.5 },
        { category: 'AEO' as const, key: 'passage_relevance', value: 1, weight: 12.5 },
      ];

      const score = calculateScore(checks);

      assert.equal(score, 100);
    });

    it('should calculate score as 50 when half checks pass', () => {
      const checks = [
        { category: 'AEO' as const, key: 'snippet_optimization', value: 1, weight: 12.5 },
        { category: 'AEO' as const, key: 'answer_box_eligibility', value: 0, weight: 12.5 },
        { category: 'AEO' as const, key: 'featured_snippet_preparation', value: 1, weight: 12.5 },
        { category: 'AEO' as const, key: 'table_list_structure', value: 0, weight: 12.5 },
        { category: 'AEO' as const, key: 'inline_code_examples', value: 1, weight: 12.5 },
        { category: 'AEO' as const, key: 'definition_clarity', value: 0, weight: 12.5 },
        { category: 'AEO' as const, key: 'faq_schema', value: 1, weight: 12.5 },
        { category: 'AEO' as const, key: 'passage_relevance', value: 0, weight: 12.5 },
      ];

      const score = calculateScore(checks);

      assert.equal(score, 50);
    });

    it('should handle single check correctly', () => {
      const checks = [
        { category: 'AEO' as const, key: 'snippet_optimization', value: 1, weight: 100 },
      ];

      const score = calculateScore(checks);

      assert.equal(score, 100);
    });

    it('should handle multiple checks with different weights', () => {
      const checks = [
        { category: 'AEO' as const, key: 'snippet_optimization', value: 1, weight: 30 },
        { category: 'AEO' as const, key: 'answer_box_eligibility', value: 0, weight: 70 },
      ];

      const score = calculateScore(checks);

      assert.equal(score, 30);
    });
  });

  describe('Check Patterns', () => {
    it('should recognize snippet optimization patterns', () => {
      const html1 = '<meta name="description" content="test"><p>Lorem ipsum dolor sit amet consectetur adipiscing elit.</p>';
      const hasPattern = /<meta[^>]+name=["']description["'][^>]*>/i.test(html1) && /<p[^>]*>.{50,}/i.test(html1);
      assert.equal(hasPattern, true);
    });

    it('should recognize answer box eligibility patterns', () => {
      const html2 = '<h2>What is SEO?</h2><p>Search Engine Optimization is the practice of optimizing.</p>';
      const hasHeading = /<h[1-6][^>]*>.+?<\/h[1-6]>/i.test(html2);
      const hasAnswer = /(<p[^>]*>.{20,100}?[.!?]<\/p>|<blockquote[^>]*>[\s\S]*?<\/blockquote>)/i.test(html2);
      assert.equal(hasHeading && hasAnswer, true);
    });

    it('should recognize featured snippet patterns', () => {
      const html3 = '<ul><li>First item</li><li>Second item</li></ul>';
      const hasLists = /<(?:ul|ol)[^>]*>[\s\S]*?<\/(?:ul|ol)>/i.test(html3);
      assert.equal(hasLists, true);
    });

    it('should recognize FAQ schema patterns', () => {
      const html4 = '{"@type": "FAQPage", "mainEntity": []}';
      const hasFaq = /"@type"\s*:\s*"FAQPage"|"@type"\s*:\s*"Question"|itemtype=["']https?:\/\/schema\.org\/FAQPage["']/i.test(html4);
      assert.equal(hasFaq, true);
    });

    it('should recognize code example patterns', () => {
      const html5 = '<code>const x = 5;</code>';
      const hasCode = /<(?:code|pre)[^>]*>[\s\S]*?<\/(?:code|pre)>/i.test(html5) || /<code[^>]*>/i.test(html5);
      assert.equal(hasCode, true);
    });

    it('should calculate word count for passage relevance', () => {
      const html6 = '<h1>Title</h1>' + '<p>word </p>'.repeat(100);
      const stripped = html6.replace(/<[^>]*>/g, ' ');
      const words = stripped.split(/\s+/).length;
      assert.ok(words > 50);
    });
  });
});

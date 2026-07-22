import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { assignWeights, calculateScore } from './brand-audit.util';

describe('brandAudit', () => {
  describe('assignWeights', () => {
    it('should assign equal weights to all checks', () => {
      const checks = [
        { category: 'BRAND' as const, key: 'brand_consistency', value: 1 },
        { category: 'BRAND' as const, key: 'color_consistency', value: 0 },
        { category: 'BRAND' as const, key: 'typography_consistency', value: 1 },
        { category: 'BRAND' as const, key: 'brand_messaging', value: 1 },
        { category: 'BRAND' as const, key: 'social_links', value: 0 },
        { category: 'BRAND' as const, key: 'brand_guidelines', value: 1 },
        { category: 'BRAND' as const, key: 'favicon_present', value: 0 },
        { category: 'BRAND' as const, key: 'author_metadata', value: 1 },
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
        { category: 'BRAND' as const, key: 'brand_consistency', value: 0, weight: 12.5 },
        { category: 'BRAND' as const, key: 'color_consistency', value: 0, weight: 12.5 },
        { category: 'BRAND' as const, key: 'typography_consistency', value: 0, weight: 12.5 },
        { category: 'BRAND' as const, key: 'brand_messaging', value: 0, weight: 12.5 },
        { category: 'BRAND' as const, key: 'social_links', value: 0, weight: 12.5 },
        { category: 'BRAND' as const, key: 'brand_guidelines', value: 0, weight: 12.5 },
        { category: 'BRAND' as const, key: 'favicon_present', value: 0, weight: 12.5 },
        { category: 'BRAND' as const, key: 'author_metadata', value: 0, weight: 12.5 },
      ];

      const score = calculateScore(checks);

      assert.equal(score, 0);
    });

    it('should calculate score as 100 when all checks pass', () => {
      const checks = [
        { category: 'BRAND' as const, key: 'brand_consistency', value: 1, weight: 12.5 },
        { category: 'BRAND' as const, key: 'color_consistency', value: 1, weight: 12.5 },
        { category: 'BRAND' as const, key: 'typography_consistency', value: 1, weight: 12.5 },
        { category: 'BRAND' as const, key: 'brand_messaging', value: 1, weight: 12.5 },
        { category: 'BRAND' as const, key: 'social_links', value: 1, weight: 12.5 },
        { category: 'BRAND' as const, key: 'brand_guidelines', value: 1, weight: 12.5 },
        { category: 'BRAND' as const, key: 'favicon_present', value: 1, weight: 12.5 },
        { category: 'BRAND' as const, key: 'author_metadata', value: 1, weight: 12.5 },
      ];

      const score = calculateScore(checks);

      assert.equal(score, 100);
    });

    it('should calculate score as 50 when half checks pass', () => {
      const checks = [
        { category: 'BRAND' as const, key: 'brand_consistency', value: 1, weight: 12.5 },
        { category: 'BRAND' as const, key: 'color_consistency', value: 0, weight: 12.5 },
        { category: 'BRAND' as const, key: 'typography_consistency', value: 1, weight: 12.5 },
        { category: 'BRAND' as const, key: 'brand_messaging', value: 0, weight: 12.5 },
        { category: 'BRAND' as const, key: 'social_links', value: 1, weight: 12.5 },
        { category: 'BRAND' as const, key: 'brand_guidelines', value: 0, weight: 12.5 },
        { category: 'BRAND' as const, key: 'favicon_present', value: 1, weight: 12.5 },
        { category: 'BRAND' as const, key: 'author_metadata', value: 0, weight: 12.5 },
      ];

      const score = calculateScore(checks);

      assert.equal(score, 50);
    });
  });

  describe('Check Patterns', () => {
    it('should recognize brand consistency patterns', () => {
      const html = '<img alt="logo" src="/logo.png"><nav>Menu</nav>';
      const hasLogo = /<img[^>]*(?:alt=["'].*?logo|src=["'].*?logo)[^>]*>/i.test(html) ||
        /class=["'].*?logo|class=["'].*?brand["']/i.test(html);
      const hasNav = /<nav[^>]*>[\s\S]*?<\/nav>/i.test(html);
      assert.equal(hasLogo && hasNav, true);
    });

    it('should recognize color consistency patterns', () => {
      const html = '<style>:root { --primary: #00f; }</style>';
      const hasCss = /<link[^>]+href=["'].*?\.css["'][^>]*>|<style[^>]*>[\s\S]*?<\/style>/i.test(html);
      const hasVars = /--color|--primary|--brand|color\s*:\s*#/i.test(html);
      assert.equal(hasCss && hasVars, true);
    });

    it('should recognize typography patterns', () => {
      const html = '@import url(fonts.google.com); <h1>Title</h1>';
      const hasFont = /@import|@font-face|font-family|googleapis|fonts\./i.test(html);
      const hasHead = /<h[1-6][^>]*>.+?<\/h[1-6]>/i.test(html);
      assert.equal(hasFont && hasHead, true);
    });

    it('should recognize social links patterns', () => {
      const html = '<footer><a href="https://facebook.com/brand">Follow</a></footer>';
      const hasSocial = /facebook\.com|instagram\.com|twitter\.com|linkedin\.com|youtube\.com|tiktok\.com/i.test(html);
      const hasFooter = /<footer[^>]*>[\s\S]*?<\/footer>/i.test(html);
      assert.equal(hasSocial && hasFooter, true);
    });

    it('should recognize favicon patterns', () => {
      const html = '<link rel="icon" href="/favicon.ico">';
      const hasFavicon = /<link[^>]*rel=["'](?:icon|shortcut icon)["'][^>]*>/i.test(html);
      assert.equal(hasFavicon, true);
    });
  });
});

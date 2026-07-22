import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { assignWeights, calculateScore } from './authority-audit.util';

describe('authorityAudit', () => {
  describe('assignWeights', () => {
    it('should assign equal weights to all checks', () => {
      const checks = [
        { category: 'AUTHORITY' as const, key: 'security_certificate', value: 1 },
        { category: 'AUTHORITY' as const, key: 'backlinks_indicators', value: 0 },
        { category: 'AUTHORITY' as const, key: 'author_credibility', value: 1 },
        { category: 'AUTHORITY' as const, key: 'publication_dates', value: 1 },
        { category: 'AUTHORITY' as const, key: 'source_citations', value: 0 },
        { category: 'AUTHORITY' as const, key: 'expertise_signals', value: 1 },
        { category: 'AUTHORITY' as const, key: 'trust_signals', value: 0 },
        { category: 'AUTHORITY' as const, key: 'contact_information', value: 1 },
      ];

      const weighted = assignWeights(checks);

      assert.equal(weighted.length, 8);
      weighted.forEach((check) => {
        assert.equal(check.weight, 12.5);
      });
    });
  });

  describe('calculateScore', () => {
    it('should return 100 when all checks pass', () => {
      const checks = Array(8).fill(0).map((_, i) => ({
        category: 'AUTHORITY' as const,
        key: `check_${i}`,
        value: 1,
        weight: 12.5,
      }));

      const score = calculateScore(checks);
      assert.equal(score, 100);
    });

    it('should return 0 when all checks fail', () => {
      const checks = Array(8).fill(0).map((_, i) => ({
        category: 'AUTHORITY' as const,
        key: `check_${i}`,
        value: 0,
        weight: 12.5,
      }));

      const score = calculateScore(checks);
      assert.equal(score, 0);
    });

    it('should return 50 when half checks pass', () => {
      const checks = [
        { category: 'AUTHORITY' as const, key: 'check_0', value: 1, weight: 12.5 },
        { category: 'AUTHORITY' as const, key: 'check_1', value: 0, weight: 12.5 },
        { category: 'AUTHORITY' as const, key: 'check_2', value: 1, weight: 12.5 },
        { category: 'AUTHORITY' as const, key: 'check_3', value: 0, weight: 12.5 },
        { category: 'AUTHORITY' as const, key: 'check_4', value: 1, weight: 12.5 },
        { category: 'AUTHORITY' as const, key: 'check_5', value: 0, weight: 12.5 },
        { category: 'AUTHORITY' as const, key: 'check_6', value: 1, weight: 12.5 },
        { category: 'AUTHORITY' as const, key: 'check_7', value: 0, weight: 12.5 },
      ];

      const score = calculateScore(checks);
      assert.equal(score, 50);
    });
  });
});

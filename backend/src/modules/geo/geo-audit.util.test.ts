import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { assignWeights, calculateScore } from './geo-audit.util';

describe('geoAudit', () => {
  describe('assignWeights', () => {
    it('should distribute 100 points equally among GEO checks', () => {
      const rawChecks = [
        { category: 'GEO' as const, key: 'schema_org_completeness', value: 1 },
        { category: 'GEO' as const, key: 'openapi_metadata', value: 0 },
        { category: 'GEO' as const, key: 'entity_recognition_tags', value: 1 },
      ];

      const checks = assignWeights(rawChecks);

      const totalWeight = checks.reduce((sum, c) => sum + c.weight, 0);
      assert.equal(totalWeight, 100);

      checks.forEach((check) => {
        assert.equal(check.weight, 100 / 3);
        assert.equal(check.category, 'GEO');
      });
    });

    it('should preserve all check properties after weight assignment', () => {
      const rawChecks = [
        { category: 'GEO' as const, key: 'test_key', value: 1 },
      ];

      const checks = assignWeights(rawChecks);

      assert.equal(checks.length, 1);
      assert.equal(checks[0].category, 'GEO');
      assert.equal(checks[0].key, 'test_key');
      assert.equal(checks[0].value, 1);
      assert.equal(checks[0].weight, 100);
    });

    it('should handle 8 checks with equal weights', () => {
      const rawChecks = Array.from({ length: 8 }, (_, i) => ({
        category: 'GEO' as const,
        key: `check_${i}`,
        value: i % 2,
      }));

      const checks = assignWeights(rawChecks);

      assert.equal(checks.length, 8);
      checks.forEach((check) => {
        assert.equal(check.weight, 12.5);
      });

      const totalWeight = checks.reduce((sum, c) => sum + c.weight, 0);
      assert.equal(totalWeight, 100);
    });
  });

  describe('calculateScore', () => {
    it('should return 100 when all checks pass', () => {
      const checks = Array.from({ length: 8 }, (_, i) => ({
        category: 'GEO' as const,
        key: `check_${i}`,
        value: 1,
        weight: 12.5,
      }));

      const score = calculateScore(checks);
      assert.equal(score, 100);
    });

    it('should return 0 when all checks fail', () => {
      const checks = Array.from({ length: 8 }, (_, i) => ({
        category: 'GEO' as const,
        key: `check_${i}`,
        value: 0,
        weight: 12.5,
      }));

      const score = calculateScore(checks);
      assert.equal(score, 0);
    });

    it('should return 50 when half checks pass', () => {
      const checks = [
        { category: 'GEO' as const, key: 'k1', value: 1, weight: 50 },
        { category: 'GEO' as const, key: 'k2', value: 0, weight: 50 },
      ];

      const score = calculateScore(checks);
      assert.equal(score, 50);
    });

    it('should calculate weighted average correctly', () => {
      const checks = [
        { category: 'GEO' as const, key: 'k1', value: 1, weight: 30 },
        { category: 'GEO' as const, key: 'k2', value: 1, weight: 30 },
        { category: 'GEO' as const, key: 'k3', value: 0, weight: 40 },
      ];

      const score = calculateScore(checks);
      // (1*30 + 1*30 + 0*40) / 100 = 60 / 100 = 60
      assert.equal(score, 60);
    });

    it('should round to nearest integer', () => {
      const checks = [
        { category: 'GEO' as const, key: 'k1', value: 1, weight: 33.33 },
        { category: 'GEO' as const, key: 'k2', value: 1, weight: 33.33 },
        { category: 'GEO' as const, key: 'k3', value: 0, weight: 33.34 },
      ];

      const score = calculateScore(checks);
      // (1*33.33 + 1*33.33 + 0*33.34) / 100 = 66.66 / 100 = 66.66 → 67
      assert.equal(score, 67);
    });
  });

  describe('assignWeights + calculateScore integration', () => {
    it('should calculate score correctly after assigning weights', () => {
      const rawChecks = [
        { category: 'GEO' as const, key: 'k1', value: 1 },
        { category: 'GEO' as const, key: 'k2', value: 0 },
        { category: 'GEO' as const, key: 'k3', value: 1 },
        { category: 'GEO' as const, key: 'k4', value: 0 },
      ];

      const checks = assignWeights(rawChecks);
      const score = calculateScore(checks);

      // 2 pass, 2 fail → (2 * 25) / 100 = 50
      assert.equal(score, 50);
    });

    it('should handle single check', () => {
      const rawChecks = [
        { category: 'GEO' as const, key: 'k1', value: 1 },
      ];

      const checks = assignWeights(rawChecks);
      const score = calculateScore(checks);

      assert.equal(score, 100);
    });
  });
});

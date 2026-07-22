import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { assignWeights, calculateScore } from './ux-audit.util';
describe('uxAudit', () => {
  it('assigns equal weights', () => {
    const checks = Array(8).fill(0).map((_, i) => ({ category: 'UX' as const, key: `c${i}`, value: 0 }));
    const weighted = assignWeights(checks);
    weighted.forEach((c) => assert.equal(c.weight, 12.5));
  });
  it('calculates score 100 when all pass', () => {
    const checks = Array(8).fill(0).map((_, i) => ({ category: 'UX' as const, key: `c${i}`, value: 1, weight: 12.5 }));
    assert.equal(calculateScore(checks), 100);
  });
  it('calculates score 0 when all fail', () => {
    const checks = Array(8).fill(0).map((_, i) => ({ category: 'UX' as const, key: `c${i}`, value: 0, weight: 12.5 }));
    assert.equal(calculateScore(checks), 0);
  });
});

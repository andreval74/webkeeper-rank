import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { calculateScore } from './local-audit.util';
describe('localAudit', () => {
  it('calculates score correctly', () => {
    const checks = Array(8).fill(0).map((_, i) => ({ category: 'LOCAL' as const, key: `c${i}`, value: 1, weight: 12.5 }));
    assert.equal(calculateScore(checks), 100);
  });
});

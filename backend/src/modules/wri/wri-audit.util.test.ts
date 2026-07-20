import { test } from 'node:test';
import assert from 'node:assert/strict';
import { assignWeights, calculateScore, checkResponseTime, checkStructuredData } from './wri-audit.util';

test('assignWeights divide o peso da categoria igualmente entre os checks', () => {
  const checks = assignWeights([
    { category: 'Security', key: 'a', value: 1 },
    { category: 'Security', key: 'b', value: 0 },
    { category: 'Performance', key: 'c', value: 1 },
    { category: 'SEO', key: 'd', value: 1 },
  ]);

  const security = checks.filter((c) => c.category === 'Security');
  assert.equal(security.length, 2);
  assert.equal(security[0].weight, 15);
  assert.equal(security[1].weight, 15);

  const totalByCategory = checks.reduce<Record<string, number>>((acc, c) => {
    acc[c.category] = (acc[c.category] ?? 0) + c.weight;
    return acc;
  }, {});
  assert.equal(totalByCategory.Security, 30);
  assert.equal(totalByCategory.Performance, 30);
  assert.equal(totalByCategory.SEO, 40);
});

test('assignWeights lança erro se uma categoria não tiver nenhum check', () => {
  assert.throws(() =>
    assignWeights([
      { category: 'Security', key: 'a', value: 1 },
      { category: 'Performance', key: 'b', value: 1 },
    ]),
  );
});

test('checkStructuredData aceita JSON-LD válido', () => {
  const html = '<script type="application/ld+json">{"@type":"Organization"}</script>';
  assert.equal(checkStructuredData(html).value, 1);
});

test('checkStructuredData rejeita JSON-LD malformado', () => {
  const html = '<script type="application/ld+json">{not valid json}</script>';
  assert.equal(checkStructuredData(html).value, 0);
});

test('checkStructuredData retorna 0 quando não há script ld+json', () => {
  assert.equal(checkStructuredData('<html></html>').value, 0);
});

test('checkResponseTime aprova até o limite de 2000ms', () => {
  assert.equal(checkResponseTime(2000).value, 1);
  assert.equal(checkResponseTime(1999).value, 1);
  assert.equal(checkResponseTime(2001).value, 0);
});

test('calculateScore calcula a média ponderada corretamente', () => {
  const checks = assignWeights([
    { category: 'Security', key: 'a', value: 1 },
    { category: 'Performance', key: 'b', value: 0 },
    { category: 'SEO', key: 'c', value: 1 },
  ]);
  // Security=30 (1 check), Performance=30 (1 check), SEO=40 (1 check)
  // weightedScore = 1*30 + 0*30 + 1*40 = 70; totalWeight=100 → score=70
  assert.equal(calculateScore(checks), 70);
});

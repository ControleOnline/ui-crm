const test = require('node:test');
const assert = require('node:assert/strict');
const {
  formatDocumentPeriod,
  formatDocumentStatusLabel,
} = require('../../../react/utils/documentHeader');

test('status labels are translated for the compact header', () => {
  assert.equal(formatDocumentStatusLabel({ status: 'open' }), 'Aberta');
  assert.equal(formatDocumentStatusLabel({ realStatus: 'closed' }), 'Fechada');
  assert.equal(formatDocumentStatusLabel('Waiting Signature'), 'Aguardando assinatura');
  assert.equal(formatDocumentStatusLabel({ status: 'negociando' }), 'Negociando');
  assert.equal(formatDocumentStatusLabel(null), '—');
});

test('period uses the API date without timezone shifts', () => {
  assert.equal(
    formatDocumentPeriod('2026-12-01T00:00:00-05:00', '2026-12-31T00:00:00-05:00'),
    '01/12/2026 → 31/12/2026',
  );
  assert.equal(formatDocumentPeriod('2026-12-01', null), 'Início 01/12/2026');
  assert.equal(formatDocumentPeriod(null, '2026-12-31'), 'Até 31/12/2026');
  assert.equal(formatDocumentPeriod(null, null), '');
  assert.equal(formatDocumentPeriod('lixo', null), '');
});

test('end date before start is ignored instead of showing an inverted period', () => {
  assert.equal(formatDocumentPeriod('2026-12-01', '2026-11-24'), 'Início 01/12/2026');
});

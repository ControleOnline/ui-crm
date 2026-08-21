const test = require('node:test');
const assert = require('node:assert/strict');

const {
  formatApiError,
  formatProposalStartDate,
  MONTHS,
} = require('../../../react/utils/proposalCreateHelpers');

test('formatApiError handles string, array and object shapes', () => {
  assert.equal(formatApiError('falhou'), 'falhou');
  assert.equal(formatApiError({ message: [{ message: 'a' }, { title: 'b' }] }), 'a\nb');
  assert.equal(formatApiError({ description: 'x' }), 'x');
  assert.equal(formatApiError(null), 'Nao foi possivel criar a proposta.');
});

test('formatProposalStartDate validates calendar dates', () => {
  assert.equal(formatProposalStartDate('2026', '8', '19'), '2026-08-19');
  assert.equal(formatProposalStartDate('2026', '2', '30'), null);
  assert.equal(formatProposalStartDate('26', '8', '19'), null);
});

test('MONTHS has 12 entries', () => {
  assert.equal(MONTHS.length, 12);
});

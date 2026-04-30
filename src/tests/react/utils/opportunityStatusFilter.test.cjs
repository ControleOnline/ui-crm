const test = require('node:test');
const assert = require('node:assert/strict');

const {
  getOpportunityStatusFilterKey,
  normalizeOpportunityStatus,
  resolveDefaultOpportunityStatusFilterKey,
} = require('../../../react/utils/opportunityStatusFilter');

test('getOpportunityStatusFilterKey prefers @id when available', () => {
  assert.equal(
    getOpportunityStatusFilterKey({
      '@id': '/statuses/9',
      id: 2,
      realStatus: 'pending',
    }),
    '/statuses/9',
  );
});

test('getOpportunityStatusFilterKey falls back to id and real status', () => {
  assert.equal(getOpportunityStatusFilterKey({ id: 3 }), '/statuses/3');
  assert.equal(
    getOpportunityStatusFilterKey({ realStatus: ' Open ' }),
    'realStatus:open',
  );
});

test('normalizeOpportunityStatus trims and lowercases known status values', () => {
  assert.equal(normalizeOpportunityStatus({ status: ' Pending ' }), 'pending');
  assert.equal(normalizeOpportunityStatus({ realStatus: 'OPEN' }), 'open');
});

test('resolveDefaultOpportunityStatusFilterKey selects the open status by default', () => {
  assert.equal(
    resolveDefaultOpportunityStatusFilterKey([
      { id: 1, realStatus: 'pending' },
      { id: 2, realStatus: 'Open' },
      { id: 3, realStatus: 'closed' },
    ]),
    '/statuses/2',
  );
});

test('resolveDefaultOpportunityStatusFilterKey preserves the empty state when open is unavailable', () => {
  assert.equal(
    resolveDefaultOpportunityStatusFilterKey([
      { id: 1, realStatus: 'pending' },
      { id: 3, realStatus: 'closed' },
    ]),
    '',
  );
});

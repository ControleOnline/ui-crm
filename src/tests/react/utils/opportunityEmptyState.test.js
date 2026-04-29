const test = require('node:test');
const assert = require('node:assert/strict');

const {
  getOpportunityEmptyStateMode,
  hasActiveOpportunityFilters,
} = require('../../../react/utils/opportunityEmptyState');

test('returns empty mode when there is no search term or status filter', () => {
  assert.equal(getOpportunityEmptyStateMode({}), 'empty');
  assert.equal(
    hasActiveOpportunityFilters({ searchQuery: '   ', selectedStatusFilterKey: '' }),
    false,
  );
});

test('returns filtered mode when there is a search term', () => {
  assert.equal(
    getOpportunityEmptyStateMode({ searchQuery: '  acme  ' }),
    'filtered',
  );
});

test('returns filtered mode when there is a selected status filter', () => {
  assert.equal(
    getOpportunityEmptyStateMode({ selectedStatusFilterKey: '/statuses/3' }),
    'filtered',
  );
});

test('treats either filter source as enough to show the filtered empty state', () => {
  assert.equal(
    hasActiveOpportunityFilters({
      searchQuery: 'cliente',
      selectedStatusFilterKey: 'realStatus:closed',
    }),
    true,
  );
});

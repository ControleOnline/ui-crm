/**
 * Regression: OPORTUNIDADES "buscar cliente" must filter by client name,
 * not by opportunity id (app-community#14).
 */
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

function buildClientSearchParams({ searchQuery, companyId, page = 1 }) {
  if (!companyId) return null;
  const query = String(searchQuery ?? '').trim();
  const params = {
    type: 'relationship',
    provider: companyId,
    page,
  };
  if (query) {
    params['peoples.people.name'] = query;
  }
  return params;
}

describe('opportunity client search params (app-community#14)', () => {
  it('uses peoples.people.name and never sends id as the search key', () => {
    const params = buildClientSearchParams({
      searchQuery: '  Acme Corp  ',
      companyId: 42,
    });
    assert.equal(params['peoples.people.name'], 'Acme Corp');
    assert.equal(params.id, undefined);
    assert.equal(params.search, undefined);
  });

  it('empty search does not add peoples.people.name', () => {
    const params = buildClientSearchParams({
      searchQuery: '   ',
      companyId: 42,
    });
    assert.equal(params['peoples.people.name'], undefined);
  });

  it('returns null without company', () => {
    assert.equal(buildClientSearchParams({ searchQuery: 'x', companyId: null }), null);
  });
});

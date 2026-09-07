const test = require('node:test');
const assert = require('node:assert/strict');

const {
  resolveClientDetailsNavigation,
  extractId,
} = require('../../../react/utils/clientDetailsNavigation');

test('extractId strips non-digits', () => {
  assert.equal(extractId('/people/42'), '42');
  assert.equal(extractId('abc'), '');
  assert.equal(extractId(null), '');
});

test('returns null when the client reference is missing', () => {
  assert.equal(resolveClientDetailsNavigation({ reference: '' }), null);
  assert.equal(resolveClientDetailsNavigation({}), null);
});

test('returns null when reference has no numeric id', () => {
  assert.equal(
    resolveClientDetailsNavigation({ reference: '/people/' }),
    null,
  );
});

test('opens legal entities in the sellers tab with client context', () => {
  const result = resolveClientDetailsNavigation({
    reference: '/people/42',
    opportunityClient: {
      '@id': '/people/42',
      peopleType: 'J',
      name: 'ACME Ltda',
    },
    fallbackName: 'Cliente',
  });

  assert.deepEqual(result, {
    selectedClient: {
      '@id': '/people/42',
      peopleType: 'J',
      name: 'ACME Ltda',
    },
    params: {
      clientId: '42',
      contextKey: 'client',
      initialTab: 'sellers',
    },
  });
});

test('opens non-legal-entity clients in the general tab', () => {
  const result = resolveClientDetailsNavigation({
    reference: '/people/13',
    opportunityClient: {
      '@id': '/people/13',
      peopleType: 'F',
      name: 'Maria',
    },
    fallbackName: 'Cliente',
  });

  assert.equal(result.params.initialTab, 'general');
  assert.equal(result.params.clientId, '13');
  assert.equal(result.params.contextKey, 'client');
});

test('prefers the matched person and preserves its id for store context', () => {
  const matchedPerson = {
    '@id': '/people/88',
    id: 88,
    peopleType: 'J',
    name: 'Matched Co',
  };

  const result = resolveClientDetailsNavigation({
    reference: '/people/88',
    matchedPerson,
    opportunityClient: { peopleType: 'F', name: 'Ignored' },
    fallbackName: 'Fallback',
  });

  assert.equal(result.selectedClient, matchedPerson);
  assert.equal(result.params.initialTab, 'sellers');
  assert.equal(result.params.clientId, '88');
});

test('builds a minimal selectedClient when only reference is available', () => {
  const result = resolveClientDetailsNavigation({
    reference: 'people/7',
    fallbackName: 'Orphan',
  });

  assert.equal(result.params.clientId, '7');
  assert.equal(result.params.initialTab, 'general');
  assert.equal(result.selectedClient.name, 'Orphan');
  assert.equal(result.selectedClient.id, '7');
});

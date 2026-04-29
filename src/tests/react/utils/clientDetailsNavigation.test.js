const test = require('node:test');
const assert = require('node:assert/strict');

const {
  resolveClientDetailsNavigation,
} = require('../../../react/utils/clientDetailsNavigation');

test('returns null when the client reference is missing', () => {
  assert.equal(resolveClientDetailsNavigation({ reference: '' }), null);
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
});

test('prefers the matched person and preserves its id for store context', () => {
  const matchedPerson = {
    '@id': '/people/88',
    id: 88,
    peopleType: 'J',
    name: 'Cliente do cache',
  };

  const result = resolveClientDetailsNavigation({
    reference: '/people/88',
    matchedPerson,
    opportunityClient: '/people/88',
    fallbackName: 'Cliente',
  });

  assert.equal(result.selectedClient, matchedPerson);
  assert.equal(result.params.initialTab, 'sellers');
});

test('returns null when the reference has no numeric id to navigate with safety', () => {
  assert.equal(
    resolveClientDetailsNavigation({
      reference: '/people/abc',
      opportunityClient: { '@id': '/people/abc', peopleType: 'J' },
      fallbackName: 'Cliente',
    }),
    null,
  );
});

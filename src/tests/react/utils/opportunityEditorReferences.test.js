const test = require('node:test');
const assert = require('node:assert/strict');

const {
  getOpportunityEditorReferenceValue,
  resolveOpportunityEditorOption,
} = require('../../../react/utils/opportunityEditorReferences');

test('getOpportunityEditorReferenceValue reads object references and raw values', () => {
  assert.equal(
    getOpportunityEditorReferenceValue({ '@id': '/categories/4', id: 9 }),
    '/categories/4',
  );
  assert.equal(getOpportunityEditorReferenceValue({ id: 7 }), '7');
  assert.equal(getOpportunityEditorReferenceValue('/statuses/2'), '/statuses/2');
});

test('resolveOpportunityEditorOption returns the loaded option that matches the reference', () => {
  const options = [
    { '@id': '/categories/4', name: 'Inbound' },
    { '@id': '/categories/8', name: 'Referral' },
  ];

  assert.deepEqual(
    resolveOpportunityEditorOption('/categories/8', options),
    options[1],
  );
  assert.deepEqual(
    resolveOpportunityEditorOption({ id: 4 }, options),
    options[0],
  );
});

test('resolveOpportunityEditorOption preserves the original value when no expanded option is available', () => {
  assert.equal(
    resolveOpportunityEditorOption('/categories/99', [{ '@id': '/categories/4' }]),
    '/categories/99',
  );
});

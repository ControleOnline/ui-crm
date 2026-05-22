const test = require('node:test');
const assert = require('node:assert/strict');

const {
  getOpportunityEditorReferenceValue,
  normalizeOpportunityEditorDraft,
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

test('normalizeOpportunityEditorDraft resolves all relationship references against loaded options', () => {
  const statusOptions = [{ '@id': '/statuses/3', status: 'Open' }];
  const categoryOptions = [{ '@id': '/categories/8', name: 'Referral' }];
  const criticalityOptions = [{ '@id': '/categories/5', name: 'Hot' }];
  const reasonOptions = [{ '@id': '/categories/11', name: 'WhatsApp' }];

  assert.deepEqual(
    normalizeOpportunityEditorDraft({
      opportunity: {
        id: 13,
        taskStatus: 3,
        category: '/categories/8',
        criticality: { id: 5 },
        reason: '/categories/11',
      },
      statusOptions,
      categoryOptions,
      criticalityOptions,
      reasonOptions,
    }),
    {
      id: 13,
      taskStatus: statusOptions[0],
      category: categoryOptions[0],
      criticality: criticalityOptions[0],
      reason: reasonOptions[0],
    },
  );
});
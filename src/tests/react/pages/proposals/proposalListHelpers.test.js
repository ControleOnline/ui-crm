const test = require('node:test');
const assert = require('node:assert/strict');

const {
  normalizeStatusKey,
  getStatusColor,
  getContractPartyCandidates,
  isIgnoredContractPartyId,
} = require('../../../../react/pages/proposals/proposalListHelpers');

test('normalizeStatusKey lowercases and collapses separators', () => {
  assert.equal(normalizeStatusKey('Waiting_Signature'), 'waiting signature');
});

test('getStatusColor returns green for signed/active', () => {
  assert.equal(getStatusColor('signed'), '#10B981');
  assert.equal(getStatusColor('open'), '#3B82F6');
});

test('getContractPartyCandidates prefers provider then contractor order', () => {
  const contract = {
    peoples: [
      { peopleType: 'witness', people: { id: 3, name: 'W' } },
      { peopleType: 'provider', people: { id: 1, name: 'P' } },
      { peopleType: 'contractor', people: { id: 2, name: 'C' } },
    ],
  };
  const candidates = getContractPartyCandidates(contract);
  assert.equal(candidates[0].name, 'P');
  assert.equal(candidates[1].name, 'C');
});

test('isIgnoredContractPartyId ignores current company', () => {
  assert.equal(
    isIgnoredContractPartyId({ contractModel: {} }, '10', { id: 10 }),
    true,
  );
  assert.equal(
    isIgnoredContractPartyId({ contractModel: {} }, '99', { id: 10 }),
    false,
  );
});

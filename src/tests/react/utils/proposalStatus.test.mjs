import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildProposalStatusFilterOptions,
  getProposalStatusColor,
  getProposalStatusFilterKey,
  getProposalStatusLabel,
  normalizeProposalStatusKey,
  proposalMatchesStatusFilter,
} from '../../../react/utils/proposalStatus.js';

const translate = (store, type, key) => `${store}.${type}.${key}`;

test('normalizeProposalStatusKey normalizes separators and casing', () => {
  assert.equal(normalizeProposalStatusKey(' Waiting_Signature '), 'waiting signature');
});

test('getProposalStatusLabel translates known backend statuses', () => {
  assert.equal(
    getProposalStatusLabel('awaiting signature', translate),
    'contract.status.waitingSignature',
  );
  assert.equal(
    getProposalStatusLabel('PENDENTE', translate),
    'contract.status.pending',
  );
});

test('getProposalStatusLabel falls back to the raw status when there is no mapping', () => {
  assert.equal(getProposalStatusLabel('custom approval', translate), 'custom approval');
});

test('buildProposalStatusFilterOptions keeps fixed filters and appends API statuses', () => {
  const options = buildProposalStatusFilterOptions({
    contracts: [
      {
        status: {
          id: 9,
          status: 'Assinado',
          realStatus: 'signed',
          color: '#123456',
        },
      },
    ],
    translate,
  });

  assert.deepEqual(
    options.slice(0, 3).map(item => item.key),
    ['realStatus:open', 'realStatus:pending', 'realStatus:closed'],
  );
  assert.equal(options[3].key, '/statuses/9');
  assert.equal(options[3].label, 'contract.status.signed');
  assert.equal(options[3].color, '#123456');
});

test('proposalMatchesStatusFilter supports fixed and specific status filters', () => {
  const contract = {
    status: {
      id: 9,
      '@id': '/statuses/9',
      status: 'Assinado',
      realStatus: 'signed',
    },
  };
  const options = buildProposalStatusFilterOptions({ contracts: [contract], translate });

  assert.equal(proposalMatchesStatusFilter(contract, '/statuses/9', options), true);
  assert.equal(proposalMatchesStatusFilter(contract, 'realStatus:signed', options), true);
  assert.equal(proposalMatchesStatusFilter(contract, 'realStatus:open', options), false);
});

test('helpers expose consistent colors and filter keys', () => {
  assert.equal(getProposalStatusColor('aberto'), '#3B82F6');
  assert.equal(getProposalStatusFilterKey({ id: 5 }), '/statuses/5');
});

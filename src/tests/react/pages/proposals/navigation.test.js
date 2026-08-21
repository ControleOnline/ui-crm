const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const {
  buildProposalProductsParams,
  buildProposalDetailsParams,
  getProposalInitialTabIndex,
} = require('../../../../react/pages/proposals/proposalNavigation');

const proposalsPageSource = fs.readFileSync(
  path.resolve(__dirname, '../../../../react/pages/proposals/index.js'),
  'utf8',
);

const proposalDetailsSource = fs.readFileSync(
  path.resolve(__dirname, '../../../../react/pages/proposals/ProposalDetails.js'),
  'utf8',
);

const proposalCardSource = fs.readFileSync(
  path.resolve(__dirname, '../../../../react/pages/proposals/ProposalCard.js'),
  'utf8',
);

test('buildProposalProductsParams includes initialTab products', () => {
  assert.deepEqual(buildProposalProductsParams(42), {
    contractId: 42,
    initialTab: 'products',
  });
});

test('buildProposalDetailsParams omits initialTab by default', () => {
  assert.deepEqual(buildProposalDetailsParams(7), { contractId: 7 });
});

test('getProposalInitialTabIndex maps products to tab 1', () => {
  assert.equal(getProposalInitialTabIndex('products'), 1);
  assert.equal(getProposalInitialTabIndex('PRODUCTS'), 1);
  assert.equal(getProposalInitialTabIndex(''), 0);
  assert.equal(getProposalInitialTabIndex(undefined), 0);
});

test('proposal list products shortcut opens ProposalDetails with the products tab selected', () => {
  const compact = proposalCardSource.replace(/\s+/g, ' ');
  assert.match(compact, /buildProposalProductsParams\(contract\.id\)/);
  assert.match(compact, /navigation\.navigate\(\s*'ProposalDetails'/);
});

test('proposal details normalize the products tab request before selecting the products tab', () => {
  assert.match(
    proposalDetailsSource.replace(/\s+/g, ' '),
    /getProposalInitialTabIndex\(initialTab\)/,
  );
});

test('proposal details switch the active tab to Produtos when the route asks for it', () => {
  assert.match(
    proposalDetailsSource.replace(/\s+/g, ' '),
    /setActiveTab\(targetTabIndex\)/,
  );
  assert.match(
    proposalDetailsSource.replace(/\s+/g, ' '),
    /scrollRef\.current\?\.scrollTo\(\{\s*x:\s*targetTabIndex \* width,\s*animated:\s*false\s*\}\)/,
  );
});

test('proposals index still wires ProposalCard for list items', () => {
  assert.match(proposalsPageSource, /<ProposalCard/);
});

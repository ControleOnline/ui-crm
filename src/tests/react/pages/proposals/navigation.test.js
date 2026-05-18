const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const proposalsPageSource = fs.readFileSync(
  path.resolve(__dirname, '../../../..', 'react/pages/proposals/index.js'),
  'utf8',
);

const proposalDetailsSource = fs.readFileSync(
  path.resolve(__dirname, '../../../..', 'react/pages/proposals/ProposalDetails.js'),
  'utf8',
);

test('proposal list products shortcut opens ProposalDetails with the products tab selected', () => {
  assert.match(
    proposalsPageSource.replace(/\s+/g, ' '),
    /navigation\.navigate\('ProposalDetails', (buildProposalProductsParams\(contract\.id\)|\{[^}]*contractId:\s*contract\.id,[^}]*initialTab:\s*'products'[^}]*\})\)/,
  );
});

test('proposal details normalize the products tab request before selecting the products tab', () => {
  assert.match(
    proposalDetailsSource.replace(/\s+/g, ' '),
    /(String\(initialTab \|\| ''\)\.trim\(\)\.toLowerCase\(\) === 'products'|getProposalInitialTabIndex\(initialTab\))/,
  );
});

test('proposal details switch the active tab to Produtos when the route asks for it', () => {
  assert.match(
    proposalDetailsSource.replace(/\s+/g, ' '),
    /(setActiveTab\(1\)|setActiveTab\(targetTabIndex\))/,
  );
  assert.match(
    proposalDetailsSource.replace(/\s+/g, ' '),
    /scrollRef\.current\?\.scrollTo\(\{\s*x:\s*(width|targetTabIndex \* width),\s*animated:\s*false\s*\}\)/,
  );
});

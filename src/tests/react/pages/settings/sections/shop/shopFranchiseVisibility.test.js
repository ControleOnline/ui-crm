const {describe, it} = require('node:test');
const assert = require('node:assert/strict');

const {
  parseConfigListValue,
  normalizeVisibleFranchiseIds,
  pruneFranchiseAddressIds,
  resolveSelectedFranchiseCompanies,
  buildFranchiseAddressesById,
  buildFranchiseCompaniesById,
} = require('../../../../../../react/pages/settings/sections/shop/shopFranchiseVisibility');

describe('shopFranchiseVisibility helpers', () => {
  it('parses single-encoded JSON array config values', () => {
    assert.deepEqual(parseConfigListValue('["10","20"]'), ['10', '20']);
  });

  it('parses double-encoded JSON array config values (legacy save path)', () => {
    const doubleEncoded = JSON.stringify(JSON.stringify(['10', '20']));
    assert.deepEqual(parseConfigListValue(doubleEncoded), ['10', '20']);
  });

  it('normalizes entity ids from encoded configs', () => {
    const doubleEncoded = JSON.stringify(JSON.stringify(['/people/15', '22']));
    assert.deepEqual(normalizeVisibleFranchiseIds(doubleEncoded), ['15', '22']);
  });

  it('prunes address ids that are missing from the loaded directory', () => {
    const pruned = pruneFranchiseAddressIds({
      addressIds: ['1', '2', '3'],
      companyIds: ['9'],
      addressesById: {
        '1': {id: 1, linkedCompany: {id: 9}},
        '3': {id: 3, linkedCompany: {id: 8}},
      },
    });
    assert.deepEqual(pruned, ['1']);
  });

  it('keeps orphan company ids visible after refresh when directory is incomplete', () => {
    const selected = resolveSelectedFranchiseCompanies({
      companyIds: ['5', '9'],
      companiesById: {
        '5': {id: 5, alias: 'Unidade Centro', shopAddresses: []},
      },
    });
    assert.equal(selected.length, 2);
    assert.equal(selected[0].alias, 'Unidade Centro');
    assert.equal(selected[1].id, '9');
    assert.equal(selected[1].__orphan, true);
  });

  it('builds address and company maps from directory items', () => {
    const directory = [
      {
        id: 7,
        alias: 'A',
        shopAddresses: [{id: 100}, {id: 101}],
      },
    ];
    const companies = buildFranchiseCompaniesById(directory);
    const addresses = buildFranchiseAddressesById(directory);
    assert.ok(companies['7']);
    assert.equal(addresses['100'].linkedCompany.id, 7);
    assert.equal(addresses['101'].linkedCompany.id, 7);
  });
});

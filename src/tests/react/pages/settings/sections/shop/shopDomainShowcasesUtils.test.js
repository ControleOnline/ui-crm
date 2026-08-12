const {describe, it} = require('node:test');
const assert = require('node:assert/strict');

const {
  buildDomainRows,
  isShopDomain,
  normalizeDomainType,
  SHOP_DOMAIN_TYPE,
} = require('../../../../../../react/pages/settings/sections/shop/shopDomainShowcasesUtils.js');

describe('shopDomainShowcasesUtils', () => {
  it('normalizeDomainType uppercases and trims', () => {
    assert.equal(normalizeDomainType(' shop '), 'SHOP');
    assert.equal(normalizeDomainType('ERP'), 'ERP');
    assert.equal(normalizeDomainType(null), '');
  });

  it('isShopDomain accepts only SHOP (case-insensitive)', () => {
    assert.equal(isShopDomain({domainType: 'SHOP'}), true);
    assert.equal(isShopDomain({domainType: 'shop'}), true);
    assert.equal(isShopDomain({domain_type: 'SHOP'}), true);
    assert.equal(isShopDomain({domainType: 'ERP'}), false);
    assert.equal(isShopDomain({domainType: 'API'}), false);
    assert.equal(isShopDomain({domainType: 'APP'}), false);
    assert.equal(isShopDomain({}), false);
  });

  it('buildDomainRows keeps only SHOP domains', () => {
    const domains = [
      {id: 1, domain: 'erp.example.com', domainType: 'ERP'},
      {id: 2, domain: 'shop.example.com', domainType: 'SHOP'},
      {id: 3, domain: 'api.example.com', domainType: 'API'},
      {id: 4, domain: 'loja2.example.com', domainType: 'shop'},
      {id: 5, domain: 'app.example.com', domainType: 'APP'},
    ];
    const showcases = [
      {id: 10, peopleDomain: '/people_domains/2', name: 'Vitrine shop'},
      {id: 11, peopleDomain: '/people_domains/1', name: 'Ignore ERP'},
    ];

    const rows = buildDomainRows({domains, showcases});

    assert.equal(rows.length, 2);
    const ids = rows.map(r => r.domainId).sort();
    assert.deepEqual(ids, ['2', '4']);
    const byId = Object.fromEntries(rows.map(r => [r.domainId, r]));
    assert.equal(byId['2'].showcase?.id, 10);
    assert.equal(byId['4'].showcase, null);
    assert.ok(rows.every(r => isShopDomain(r.domain)));
  });

  it('buildDomainRows handles empty/missing collections', () => {
    assert.deepEqual(buildDomainRows({domains: null, showcases: null}), []);
    assert.deepEqual(buildDomainRows({domains: [], showcases: []}), []);
  });

  it('SHOP_DOMAIN_TYPE constant is SHOP', () => {
    assert.equal(SHOP_DOMAIN_TYPE, 'SHOP');
  });
});

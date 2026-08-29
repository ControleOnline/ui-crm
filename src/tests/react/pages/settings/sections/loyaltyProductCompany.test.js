const {
  normalizeLoyaltyCompanyId,
  productBelongsToCompany,
  filterProductsByCompany,
} = require('../../../../../react/pages/settings/sections/loyaltyProductCompany');

describe('loyaltyProductCompany', () => {
  test('normalizes IRI, object and digits', () => {
    expect(normalizeLoyaltyCompanyId('/people/42')).toBe('42');
    expect(normalizeLoyaltyCompanyId({id: 7})).toBe('7');
    expect(normalizeLoyaltyCompanyId({['@id']: '/people/9'})).toBe('9');
    expect(normalizeLoyaltyCompanyId('')).toBe('');
  });

  test('keeps products without company field when company is selected', () => {
    expect(productBelongsToCompany({id: 1, product: 'X'}, 10)).toBe(true);
  });

  test('drops products owned by another company', () => {
    expect(
      productBelongsToCompany({id: 1, company: '/people/99'}, 10),
    ).toBe(false);
    expect(
      productBelongsToCompany({id: 2, company: {id: 10}}, '10'),
    ).toBe(true);
  });

  test('filterProductsByCompany returns empty without company', () => {
    expect(filterProductsByCompany([{id: 1}], '')).toEqual([]);
  });

  test('filterProductsByCompany keeps only matching company', () => {
    const items = [
      {id: 1, company: 10},
      {id: 2, company: 11},
      {id: 3},
    ];
    const filtered = filterProductsByCompany(items, 10);
    expect(filtered.map(item => item.id)).toEqual([1, 3]);
  });
});

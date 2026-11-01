/*
 * @agents Company-scope helpers for Fidelidade product pickers (task-666).
 */

export const normalizeLoyaltyCompanyId = value => {
  if (value === null || value === undefined || value === '') {
    return '';
  }

  if (typeof value === 'object') {
    return normalizeLoyaltyCompanyId(
      value.id || value['@id'] || value.company || value.people,
    );
  }

  return String(value).replace(/\D+/g, '').trim();
};

export const productBelongsToCompany = (product, companyId) => {
  const expected = normalizeLoyaltyCompanyId(companyId);
  if (!expected) {
    return false;
  }

  const candidates = [
    product?.company,
    product?.companyId,
    product?.people,
    product?.peopleId,
    product?.owner,
    product?.provider,
  ].map(normalizeLoyaltyCompanyId).filter(Boolean);

  if (candidates.length === 0) {
    return true;
  }

  return candidates.includes(expected);
};

export const filterProductsByCompany = (items, companyId) => {
  const list = Array.isArray(items) ? items : [];
  const expected = normalizeLoyaltyCompanyId(companyId);
  if (!expected) {
    return [];
  }

  return list.filter(item => productBelongsToCompany(item, expected));
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    normalizeLoyaltyCompanyId,
    productBelongsToCompany,
    filterProductsByCompany,
  };
}

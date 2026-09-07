/*
 * @agents Pure helpers for shop franchise locator visibility.
 * Selection pruning must stay local — never auto-persist when the directory
 * is still loading or incomplete after refresh.
 */

const normalizeEntityId = value => {
  if (!value) {
    return '';
  }

  if (typeof value === 'object') {
    return normalizeEntityId(value?.['@id'] || value?.id);
  }

  return String(value)
    .replace(/\D+/g, '')
    .trim();
};

const parseConfigListValue = value => {
  if (value === null || value === undefined || value === '') {
    return [];
  }

  let current = value;
  for (let depth = 0; depth < 3; depth += 1) {
    if (Array.isArray(current)) {
      return current;
    }
    if (typeof current !== 'string') {
      break;
    }
    const trimmed = current.trim();
    if (!trimmed) {
      return [];
    }
    try {
      current = JSON.parse(trimmed);
    } catch {
      return trimmed.split(/\r?\n|,/);
    }
  }

  if (Array.isArray(current)) {
    return current;
  }

  if (typeof current === 'string') {
    return current.split(/\r?\n|,/);
  }

  return [];
};

const normalizeVisibleFranchiseIds = value =>
  Array.from(
    new Set(parseConfigListValue(value).map(normalizeEntityId).filter(Boolean)),
  );

const pruneFranchiseAddressIds = ({
  addressIds = [],
  companyIds = [],
  addressesById = {},
}) => {
  const companyIdSet = new Set(
    (companyIds || []).map(normalizeEntityId).filter(Boolean),
  );

  return (addressIds || [])
    .map(normalizeEntityId)
    .filter(Boolean)
    .filter(addressId => {
      const address = addressesById[addressId];
      if (!address) {
        return false;
      }
      const linkedCompanyId = normalizeEntityId(address?.linkedCompany);
      return Boolean(linkedCompanyId && companyIdSet.has(linkedCompanyId));
    });
};

const resolveSelectedFranchiseCompanies = ({
  companyIds = [],
  companiesById = {},
}) =>
  (companyIds || [])
    .map(normalizeEntityId)
    .filter(Boolean)
    .map(companyId => {
      const company = companiesById[companyId];
      if (company) {
        return company;
      }
      return {
        id: companyId,
        alias: `Franquia #${companyId}`,
        name: `Franquia #${companyId}`,
        shopAddresses: [],
        __orphan: true,
      };
    });

const buildFranchiseAddressesById = (directory = []) => {
  const map = {};
  (directory || []).forEach(company => {
    const linkedCompany = {
      id: company?.id,
      alias: company?.alias,
      name: company?.name,
    };
    (company?.shopAddresses || []).forEach(address => {
      const addressId = normalizeEntityId(address);
      if (addressId) {
        map[addressId] = {...address, linkedCompany};
      }
    });
  });
  return map;
};

const buildFranchiseCompaniesById = (directory = []) => {
  const map = {};
  (directory || []).forEach(company => {
    const companyId = normalizeEntityId(company);
    if (companyId) {
      map[companyId] = company;
    }
  });
  return map;
};

module.exports = {
  buildFranchiseAddressesById,
  buildFranchiseCompaniesById,
  normalizeFranchiseEntityId: normalizeEntityId,
  normalizeVisibleFranchiseIds,
  parseConfigListValue,
  pruneFranchiseAddressIds,
  resolveSelectedFranchiseCompanies,
};

const extractCollectionItems = response => {
  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response?.['hydra:member'])) {
    return response['hydra:member'];
  }

  return [];
};

const normalizePeopleReferenceValue = value => {
  if (!value) {
    return '';
  }

  const rawValue =
    typeof value === 'object' ? value['@id'] ?? value.id : value;

  if (rawValue == null) {
    return '';
  }

  const normalized = String(rawValue).trim();
  if (!normalized) {
    return '';
  }

  if (normalized.startsWith('/people/') || normalized.startsWith('/peoples/')) {
    return normalized;
  }

  if (normalized.startsWith('/')) {
    return normalized;
  }

  if (/^\d+$/.test(normalized)) {
    return `/people/${normalized}`;
  }

  return normalized;
};

const extractId = value => String(value || '').replace(/\D/g, '');

const mergePeopleEntries = (currentItems = [], nextItems = []) => {
  const itemsByReference = new Map();

  [...currentItems, ...nextItems].forEach((item, index) => {
    const reference = normalizePeopleReferenceValue(item);
    const fallbackKey = `person-${item?.id || 'sem-id'}-${item?.document || 'sem-doc'}-${item?.name || 'sem-nome'}-${index}`;
    itemsByReference.set(reference || fallbackKey, item);
  });

  return Array.from(itemsByReference.values());
};

const normalizeSearchValue = value => {
  if (value == null) {
    return '';
  }

  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
};

const getOpportunityClientIdentity = ({
  opportunity,
  knownPeople = [],
  normalizePeopleReference = normalizePeopleReferenceValue,
}) => {
  const client = opportunity?.client;
  let name = '';
  let alias = '';

  if (client && typeof client === 'object') {
    name = String(client?.name || client?.realname || '').trim();
    alias = String(client?.alias || client?.nickname || '').trim();
  }

  const clientReference = normalizePeopleReference(client);
  if (clientReference && Array.isArray(knownPeople)) {
    const matched = knownPeople.find(item => {
      return normalizePeopleReference(item) === clientReference;
    });

    if (matched) {
      if (!name) {
        name = String(matched?.name || matched?.realname || '').trim();
      }
      if (!alias) {
        alias = String(matched?.alias || matched?.nickname || '').trim();
      }
    }
  }

  return { name, alias };
};

module.exports = {
  extractCollectionItems,
  extractId,
  getOpportunityClientIdentity,
  mergePeopleEntries,
  normalizePeopleReferenceValue,
  normalizeSearchValue,
};

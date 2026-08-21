/**
 * Pure helpers for proposals list (status labels/colors + client name resolution).
 * Extracted from the list page to keep index.js under the 500-line quality bar.
 */

function normalizeDigits(value) {
  return String(value || '').replace(/\D/g, '');
}

function normalizeText(value) {
  return String(value || '').trim();
}

function normalizeStatusKey(status) {
  return String(status || '')
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ');
}

function getStatusColor(status) {
  const normalized = normalizeStatusKey(status);

  switch (normalized) {
    case 'ativo':
    case 'active':
    case 'assinado':
    case 'signed':
      return '#10B981';
    case 'inativo':
    case 'inactive':
    case 'cancelado':
    case 'canceled':
      return '#c10015';
    case 'pendente':
    case 'pending':
      return '#e67e22';
    case 'open':
    case 'aberto':
      return '#3B82F6';
    default:
      return '#64748B';
  }
}

function getStatusLabel(status) {
  const normalized = normalizeStatusKey(status);
  const map = {
    ativo: global.t?.t('contract', 'status', 'active'),
    active: global.t?.t('contract', 'status', 'active'),
    inativo: global.t?.t('contract', 'status', 'inactive'),
    inactive: global.t?.t('contract', 'status', 'inactive'),
    pendente: global.t?.t('contract', 'status', 'pending'),
    pending: global.t?.t('contract', 'status', 'pending'),
    open: global.t?.t('contract', 'status', 'open'),
    aberto: global.t?.t('contract', 'status', 'open'),
    closed: global.t?.t('contract', 'status', 'closed'),
    fechado: global.t?.t('contract', 'status', 'closed'),
    cancelado: global.t?.t('contract', 'status', 'canceled'),
    canceled: global.t?.t('contract', 'status', 'canceled'),
    'waiting signature': global.t?.t('contract', 'status', 'waitingSignature'),
    'awaiting signature': global.t?.t('contract', 'status', 'waitingSignature'),
    'signature pending': global.t?.t('contract', 'status', 'waitingSignature'),
    assinado: global.t?.t('contract', 'status', 'signed'),
    signed: global.t?.t('contract', 'status', 'signed'),
    draft: global.t?.t('contract', 'status', 'draft'),
    rascunho: global.t?.t('contract', 'status', 'draft'),
  };

  return map[normalized] || status || global.t?.t('contract', 'label', 'na');
}

function extractPeopleId(person) {
  if (person == null) return '';
  if (typeof person === 'string' || typeof person === 'number') {
    return normalizeDigits(person);
  }
  if (person.id != null) return normalizeDigits(person.id);
  if (person['@id']) {
    const parts = String(person['@id']).split('/');
    return normalizeDigits(parts[parts.length - 1]);
  }
  return '';
}

function resolvePeopleName(person) {
  if (!person || typeof person !== 'object') return '';
  return (
    normalizeText(person.name) ||
    normalizeText(person.alias) ||
    normalizeText(person.people?.name) ||
    normalizeText(person.people?.alias) ||
    ''
  );
}

function getContractPartyCandidates(contract) {
  const participants = Array.isArray(contract?.peoples) ? contract.peoples : [];
  const participantsOrdered = [...participants].sort((left, right) => {
    const leftType = String(left?.peopleType || '').trim().toLowerCase();
    const rightType = String(right?.peopleType || '').trim().toLowerCase();

    const weight = type => {
      if (type === 'provider') return 0;
      if (type === 'contractor') return 1;
      if (type === 'witness') return 2;
      return 3;
    };

    return weight(leftType) - weight(rightType);
  });

  return [
    ...participantsOrdered.map(entry => entry?.people),
    contract?.client,
    contract?.customer,
    contract?.contractor,
    contract?.people,
    contract?.provider,
  ].filter(Boolean);
}

function isCurrentCompanyPerson(person, currentCompany) {
  const reference = String(
    typeof person === 'object' ? person?.['@id'] || person?.id : person || '',
  ).trim();
  const companyId = normalizeDigits(currentCompany?.id);
  if (!reference || !companyId) {
    return false;
  }

  const referenceDigits = extractPeopleId(reference);
  return (
    reference === `/people/${companyId}` ||
    reference === `/peoples/${companyId}` ||
    referenceDigits === companyId
  );
}

function isIgnoredContractPartyId(contract, personId, currentCompany) {
  if (!personId) {
    return true;
  }

  const companyId = normalizeDigits(currentCompany?.id);
  const modelPeopleId = normalizeDigits(contract?.contractModel?.people);
  const signerId = normalizeDigits(contract?.contractModel?.signer);

  return [companyId, modelPeopleId, signerId].some(
    referenceId => referenceId && referenceId === personId,
  );
}

function getResolvedPeopleName(person, peopleNameById = {}) {
  const directName = resolvePeopleName(person);
  if (directName) {
    return directName;
  }

  const personId = extractPeopleId(person);
  return personId ? peopleNameById[personId] || '' : '';
}

function getContractClientName(contract, { currentCompany, peopleNameById } = {}) {
  const candidates = getContractPartyCandidates(contract);
  for (const candidate of candidates) {
    const personId = extractPeopleId(candidate);
    if (personId && isIgnoredContractPartyId(contract, personId, currentCompany)) {
      continue;
    }

    if (personId && isCurrentCompanyPerson(candidate, currentCompany)) {
      continue;
    }

    const name = getResolvedPeopleName(candidate, peopleNameById);
    if (name) {
      return name;
    }
  }

  return '';
}

function isContractClientPendingResolution(
  contract,
  { currentCompany, peopleNameById } = {},
) {
  const candidates = getContractPartyCandidates(contract);
  return candidates.some(candidate => {
    const personId = extractPeopleId(candidate);
    if (!personId || isIgnoredContractPartyId(contract, personId, currentCompany)) {
      return false;
    }

    const name = getResolvedPeopleName(candidate, peopleNameById);
    return !name;
  });
}

module.exports = {
  normalizeDigits,
  normalizeText,
  normalizeStatusKey,
  getStatusColor,
  getStatusLabel,
  extractPeopleId,
  resolvePeopleName,
  getContractPartyCandidates,
  isCurrentCompanyPerson,
  isIgnoredContractPartyId,
  getResolvedPeopleName,
  getContractClientName,
  isContractClientPendingResolution,
};

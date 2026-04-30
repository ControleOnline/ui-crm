export const normalizeProposalStatusKey = value =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ');

export const getProposalStatusColor = status => {
  const normalized = normalizeProposalStatusKey(status);

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
      return '#EF4444';
    case 'pendente':
    case 'pending':
      return '#F59E0B';
    case 'open':
    case 'aberto':
      return '#3B82F6';
    default:
      return '#64748B';
  }
};

export const getProposalStatusTranslationKey = status => {
  const normalized = normalizeProposalStatusKey(status);
  const map = {
    ativo: 'active',
    active: 'active',
    inativo: 'inactive',
    inactive: 'inactive',
    pendente: 'pending',
    pending: 'pending',
    open: 'open',
    aberto: 'open',
    closed: 'closed',
    fechado: 'closed',
    cancelado: 'canceled',
    canceled: 'canceled',
    'waiting signature': 'waitingSignature',
    'awaiting signature': 'waitingSignature',
    'signature pending': 'waitingSignature',
    assinado: 'signed',
    signed: 'signed',
    draft: 'draft',
    rascunho: 'draft',
  };

  return map[normalized] || '';
};

export const getProposalStatusLabel = (status, translate) => {
  const translationKey = getProposalStatusTranslationKey(status);
  if (translationKey) {
    return translate?.('contract', 'status', translationKey) || status;
  }

  return status || translate?.('contract', 'label', 'na');
};

export const getProposalStatusFilterKey = item => {
  if (!item) {
    return '';
  }

  if (item['@id']) {
    return item['@id'];
  }

  if (item.id != null) {
    return `/statuses/${item.id}`;
  }

  const normalized = normalizeProposalStatusKey(item.realStatus || item.status);
  return normalized ? `realStatus:${normalized}` : '';
};

export const buildProposalStatusFilterOptions = ({ contracts = [], translate } = {}) => {
  const options = [
    {
      key: 'realStatus:open',
      label: translate?.('contract', 'status', 'open') || 'Em aberto',
      color: getProposalStatusColor('open'),
      normalizedStatus: 'open',
    },
    {
      key: 'realStatus:pending',
      label: translate?.('contract', 'status', 'pending') || 'Pendente',
      color: getProposalStatusColor('pending'),
      normalizedStatus: 'pending',
    },
    {
      key: 'realStatus:closed',
      label: translate?.('contract', 'status', 'closed') || 'Fechado',
      color: getProposalStatusColor('closed'),
      normalizedStatus: 'closed',
    },
  ];

  contracts.forEach(contract => {
    const statusObj = contract?.status || {};
    const key = getProposalStatusFilterKey(statusObj);
    if (!key || options.some(item => item.key === key)) {
      return;
    }

    const normalizedStatus = normalizeProposalStatusKey(statusObj.realStatus || statusObj.status);
    options.push({
      key,
      label: getProposalStatusLabel(statusObj.status || statusObj.realStatus, translate),
      color: statusObj.color || getProposalStatusColor(normalizedStatus),
      normalizedStatus,
    });
  });

  return options;
};

export const proposalMatchesStatusFilter = (contract, filterKey, statusFilterOptions = []) => {
  if (!filterKey) {
    return true;
  }

  const statusObj = contract?.status || {};
  const statusIri = statusObj['@id']
    ? statusObj['@id']
    : statusObj.id != null
    ? `/statuses/${statusObj.id}`
    : '';

  const normalizedStatus = normalizeProposalStatusKey(
    statusObj.realStatus || statusObj.status,
  );
  const normalizedFilter = normalizeProposalStatusKey(
    String(filterKey || '').replace('realStatus:', ''),
  );

  if (filterKey.startsWith('/statuses/')) {
    if (statusIri === filterKey) {
      return true;
    }

    const selectedOption = statusFilterOptions.find(item => item.key === filterKey);
    if (selectedOption?.normalizedStatus) {
      return normalizedStatus === selectedOption.normalizedStatus;
    }

    return false;
  }

  return normalizedStatus === normalizedFilter;
};

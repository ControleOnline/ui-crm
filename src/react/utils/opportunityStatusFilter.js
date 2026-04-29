const normalizeOpportunityStatus = item =>
  String(item?.realStatus || item?.status || '')
    .trim()
    .toLowerCase();

const getOpportunityStatusFilterKey = item => {
  if (!item) {
    return '';
  }

  if (item['@id']) {
    return item['@id'];
  }

  if (item.id != null) {
    return `/statuses/${item.id}`;
  }

  const normalizedStatus = normalizeOpportunityStatus(item);
  return normalizedStatus ? `realStatus:${normalizedStatus}` : '';
};

const resolveDefaultOpportunityStatusFilterKey = statusItems => {
  if (!Array.isArray(statusItems) || statusItems.length === 0) {
    return '';
  }

  const defaultOpenStatus = statusItems.find(
    item => normalizeOpportunityStatus(item) === 'open',
  );

  return getOpportunityStatusFilterKey(defaultOpenStatus);
};

module.exports = {
  getOpportunityStatusFilterKey,
  normalizeOpportunityStatus,
  resolveDefaultOpportunityStatusFilterKey,
};

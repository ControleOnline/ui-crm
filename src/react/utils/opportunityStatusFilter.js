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

/**
 * True only before the default has been applied and statuses are available.
 * After first apply, empty selectedStatusFilterKey means intentional "all".
 */
const shouldApplyDefaultOpportunityStatusFilter = ({
  hasAppliedDefault,
  statusItemsLength,
}) => {
  if (hasAppliedDefault) {
    return false;
  }
  return statusItemsLength > 0;
};

module.exports = {
  getOpportunityStatusFilterKey,
  normalizeOpportunityStatus,
  resolveDefaultOpportunityStatusFilterKey,
  shouldApplyDefaultOpportunityStatusFilter,
};

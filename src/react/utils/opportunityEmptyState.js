const normalizeSearchValue = value =>
  String(value || '')
    .trim()
    .toLowerCase();

const hasActiveOpportunityFilters = ({
  searchQuery = '',
  selectedStatusFilterKey = '',
} = {}) =>
  Boolean(
    normalizeSearchValue(searchQuery) || String(selectedStatusFilterKey || '').trim(),
  );

const getOpportunityEmptyStateMode = filters =>
  hasActiveOpportunityFilters(filters) ? 'filtered' : 'empty';

module.exports = {
  getOpportunityEmptyStateMode,
  hasActiveOpportunityFilters,
};

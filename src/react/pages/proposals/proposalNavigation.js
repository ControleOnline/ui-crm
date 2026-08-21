/**
 * Navigation helpers for proposal details (app-community#55).
 * Opens ProposalDetails already on the products tab so users can associate products/services.
 */

function buildProposalDetailsParams(contractId, options = {}) {
  const params = { contractId };
  if (options.initialTab) {
    params.initialTab = options.initialTab;
  }
  return params;
}

function buildProposalProductsParams(contractId) {
  return buildProposalDetailsParams(contractId, { initialTab: 'products' });
}

function getProposalInitialTabIndex(initialTab) {
  return String(initialTab || '').trim().toLowerCase() === 'products' ? 1 : 0;
}

module.exports = {
  buildProposalDetailsParams,
  buildProposalProductsParams,
  getProposalInitialTabIndex,
};

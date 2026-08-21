/**
 * Request params for the franchisee "royalties a pagar" view.
 * Franchisee (current company) is the payer; invoice type is royalties.
 * Counterparty filter (franqueadora) uses the receiver column via DefaultTable filters.
 */
export const ROYALTIES_INVOICE_TYPE = 'royalties';

export const resolveRoyaltiesPayableRequestParams = ({ companyId } = {}) => {
  const params = {
    invoiceType: ROYALTIES_INVOICE_TYPE,
  };

  if (!companyId) {
    return params;
  }

  return {
    ...params,
    payer: companyId,
    excludeOwnTransfers: 1,
  };
};

export const resolveRoyaltiesPayableVisibleColumnsKey = () =>
  'financialEntries:royaltiesPayable';

export const DEFAULT_ROYALTIES_DATE_FILTER = {
  shortcut: 'this_month',
  customRange: { from: '', to: '' },
};

export default {
  ROYALTIES_INVOICE_TYPE,
  resolveRoyaltiesPayableRequestParams,
  resolveRoyaltiesPayableVisibleColumnsKey,
  DEFAULT_ROYALTIES_DATE_FILTER,
};

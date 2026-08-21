/**
 * Request params for the franchisor "royalties a receber" view (ui-crm#23).
 * Franchisor (current company) is the receiver; franchisee is the payer.
 * Business rule: franchisee pays → franchisor receives.
 * Counterparty filter (franqueado) uses the payer column via DefaultTable filters.
 */

export const ROYALTIES_INVOICE_TYPE = 'royalties';

export const resolveRoyaltiesReceivableRequestParams = ({
  companyId,
  franchiseeId,
} = {}) => {
  const params = {
    invoiceType: ROYALTIES_INVOICE_TYPE,
  };

  if (!companyId) {
    return params;
  }

  const next = {
    ...params,
    receiver: companyId,
    excludeOwnTransfers: 1,
  };

  if (franchiseeId != null && franchiseeId !== '') {
    const payerId =
      typeof franchiseeId === 'object'
        ? franchiseeId.value ?? franchiseeId.id ?? franchiseeId['@id']
        : franchiseeId;
    const normalized = String(payerId || '').replace(/\D/g, '');
    if (normalized) {
      next.payer = normalized;
    }
  }

  return next;
};

export const resolveRoyaltiesReceivablePreferenceKey = () =>
  'financialEntries:royaltiesReceivable';

export const resolveRoyaltiesReceivableTitle = (translate) => {
  const translated =
    typeof translate === 'function'
      ? translate('invoice', 'label', 'royaltiesReceivable')
      : '';
  return String(translated || '').trim() || 'Royalties a receber';
};

export const ROYALTIES_FLOW_NOTE =
  'Franquia: franqueada paga → franqueadora recebe (invoice tipo royalties).';

export const DEFAULT_ROYALTIES_RECEIVABLE_DATE_FILTER = {
  shortcut: 'this_month',
  customRange: { from: '', to: '' },
};

export default {
  ROYALTIES_INVOICE_TYPE,
  resolveRoyaltiesReceivableRequestParams,
  resolveRoyaltiesReceivablePreferenceKey,
  resolveRoyaltiesReceivableTitle,
  ROYALTIES_FLOW_NOTE,
  DEFAULT_ROYALTIES_RECEIVABLE_DATE_FILTER,
};

/**
 * Helpers for Franqueadora "Royalties a receber" list.
 * Business rule: franchisee pays → franchisor (franqueadora) receives.
 * Invoice perspective: receiver = current company; payer = franchisee.
 */

const normalizeText = value => String(value || '').trim();

const resolveEntityId = value => {
  if (value && typeof value === 'object') {
    return resolveEntityId(value.value ?? value.id ?? value['@id'] ?? '');
  }
  return String(value || '').replace(/\D/g, '');
};

/**
 * Fixed request params for franchisor receivables of royalty invoices.
 * - receiver = franqueadora (current company)
 * - excludeOwnTransfers keeps pure third-party receivables
 * - categoryContext is a soft hint for future/backend category alignment
 */
export const resolveRoyaltiesReceivableRequestParams = ({
  companyId,
  franchiseeId,
} = {}) => {
  const params = {
    invoiceType: 'invoice',
    excludeOwnTransfers: 1,
    categoryContext: 'royalties',
  };

  const receiverId = resolveEntityId(companyId);
  if (receiverId) {
    params.receiver = receiverId;
  }

  const payerId = resolveEntityId(franchiseeId);
  if (payerId) {
    params.payer = payerId;
  }

  return params;
};

export const resolveRoyaltiesReceivablePreferenceKey = () =>
  'financialEntries:royaltiesReceivable';

export const resolveRoyaltiesReceivableTitle = (translate) => {
  const translated =
    typeof translate === 'function'
      ? translate('invoice', 'label', 'royaltiesReceivable')
      : '';
  return normalizeText(translated) || 'Royalties a receber';
};

export const ROYALTIES_FLOW_NOTE =
  'Franquia: franqueada paga → franqueadora recebe (invoice categoria/contexto royalties).';

export default {
  resolveRoyaltiesReceivableRequestParams,
  resolveRoyaltiesReceivablePreferenceKey,
  resolveRoyaltiesReceivableTitle,
  ROYALTIES_FLOW_NOTE,
};

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  ROYALTIES_INVOICE_TYPE,
  resolveRoyaltiesReceivableRequestParams,
  resolveRoyaltiesReceivablePreferenceKey,
  resolveRoyaltiesReceivableTitle,
  ROYALTIES_FLOW_NOTE,
  DEFAULT_ROYALTIES_RECEIVABLE_DATE_FILTER,
} = require('../../../../react/pages/royalties/royaltiesReceivableHelpers.js');

describe('royaltiesReceivableHelpers', () => {
  it('exports royalties invoice type constant', () => {
    assert.equal(ROYALTIES_INVOICE_TYPE, 'royalties');
  });

  it('builds request params without company (type only)', () => {
    const params = resolveRoyaltiesReceivableRequestParams({});
    assert.deepEqual(params, { invoiceType: 'royalties' });
  });

  it('builds franchisor receivables params with receiver + exclude own transfers', () => {
    const params = resolveRoyaltiesReceivableRequestParams({ companyId: 42 });
    assert.deepEqual(params, {
      invoiceType: 'royalties',
      receiver: 42,
      excludeOwnTransfers: 1,
    });
  });

  it('adds franchisee (payer) filter when provided', () => {
    const params = resolveRoyaltiesReceivableRequestParams({
      companyId: 10,
      franchiseeId: '/people/77',
    });
    assert.equal(params.receiver, 10);
    assert.equal(params.payer, '77');
    assert.equal(params.invoiceType, 'royalties');
  });

  it('uses a dedicated visible-columns preference key', () => {
    assert.equal(
      resolveRoyaltiesReceivablePreferenceKey(),
      'financialEntries:royaltiesReceivable',
    );
  });

  it('defaults date filter to this_month for franchisor view', () => {
    assert.equal(DEFAULT_ROYALTIES_RECEIVABLE_DATE_FILTER.shortcut, 'this_month');
  });

  it('title falls back to Royalties a receber', () => {
    assert.equal(resolveRoyaltiesReceivableTitle(null), 'Royalties a receber');
  });

  it('documents franchise flow direction', () => {
    assert.match(ROYALTIES_FLOW_NOTE, /franqueada paga/i);
    assert.match(ROYALTIES_FLOW_NOTE, /franqueadora recebe/i);
  });
});

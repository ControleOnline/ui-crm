const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const {
  ROYALTIES_INVOICE_TYPE,
  resolveRoyaltiesPayableRequestParams,
  resolveRoyaltiesPayableVisibleColumnsKey,
  DEFAULT_ROYALTIES_DATE_FILTER,
} = require('../../../react/utils/royaltiesPayableParams.js');

describe('royaltiesPayableParams', () => {
  it('exports royalties invoice type constant', () => {
    assert.equal(ROYALTIES_INVOICE_TYPE, 'royalties');
  });

  it('builds request params without company (type only)', () => {
    const params = resolveRoyaltiesPayableRequestParams({});
    assert.deepEqual(params, { invoiceType: 'royalties' });
  });

  it('builds franchisee payables params with payer + exclude own transfers', () => {
    const params = resolveRoyaltiesPayableRequestParams({ companyId: 42 });
    assert.deepEqual(params, {
      invoiceType: 'royalties',
      payer: 42,
      excludeOwnTransfers: 1,
    });
  });

  it('uses a dedicated visible-columns preference key', () => {
    assert.equal(
      resolveRoyaltiesPayableVisibleColumnsKey(),
      'financialEntries:royaltiesPayable',
    );
  });

  it('defaults date filter to this_month for franchisee view', () => {
    assert.equal(DEFAULT_ROYALTIES_DATE_FILTER.shortcut, 'this_month');
    assert.deepEqual(DEFAULT_ROYALTIES_DATE_FILTER.customRange, {
      from: '',
      to: '',
    });
  });
});

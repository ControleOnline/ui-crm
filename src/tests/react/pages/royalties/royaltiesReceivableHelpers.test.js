const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  resolveRoyaltiesReceivableRequestParams,
  resolveRoyaltiesReceivablePreferenceKey,
  resolveRoyaltiesReceivableTitle,
  ROYALTIES_FLOW_NOTE,
} = require('../../../../react/pages/royalties/royaltiesReceivableHelpers.js');

describe('royaltiesReceivableHelpers', () => {
  it('builds franchisor receivable params with receiver and royalties context', () => {
    const params = resolveRoyaltiesReceivableRequestParams({ companyId: 42 });
    assert.equal(params.receiver, '42');
    assert.equal(params.invoiceType, 'invoice');
    assert.equal(params.excludeOwnTransfers, 1);
    assert.equal(params.categoryContext, 'royalties');
    assert.equal(params.payer, undefined);
  });

  it('adds franchisee (payer) filter when provided', () => {
    const params = resolveRoyaltiesReceivableRequestParams({
      companyId: { id: 10 },
      franchiseeId: '/people/77',
    });
    assert.equal(params.receiver, '10');
    assert.equal(params.payer, '77');
  });

  it('omits receiver when company is missing', () => {
    const params = resolveRoyaltiesReceivableRequestParams({});
    assert.equal(params.receiver, undefined);
    assert.equal(params.categoryContext, 'royalties');
  });

  it('exposes stable preference key and title fallback', () => {
    assert.equal(
      resolveRoyaltiesReceivablePreferenceKey(),
      'financialEntries:royaltiesReceivable',
    );
    assert.equal(resolveRoyaltiesReceivableTitle(null), 'Royalties a receber');
    assert.equal(
      resolveRoyaltiesReceivableTitle(() => 'Royalties recebíveis'),
      'Royalties recebíveis',
    );
  });

  it('documents franchise flow direction', () => {
    assert.match(ROYALTIES_FLOW_NOTE, /franqueada paga/i);
    assert.match(ROYALTIES_FLOW_NOTE, /franqueadora recebe/i);
  });
});

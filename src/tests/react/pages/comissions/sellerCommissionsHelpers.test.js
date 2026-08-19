const {describe, it} = require('node:test');
const assert = require('node:assert/strict');

const {
  buildComissionRequestParams,
  buildMonthOptions,
  collectClientsFromInvoices,
  extractClientFromInvoice,
  filterInvoicesByClient,
  formatCurrency,
  groupCommissionsByMonth,
  normalizeComissionList,
  resolveInvoiceDate,
} = require('../../../../react/pages/comissions/sellerCommissionsHelpers.js');

describe('sellerCommissionsHelpers', () => {
  it('buildComissionRequestParams sets invoiceType comission and receiver', () => {
    const params = buildComissionRequestParams({
      year: '2026',
      month: '3',
      receiverId: 42,
      clientId: 11,
    });
    assert.equal(params.invoiceType, 'comission');
    assert.equal(params.receiver, 42);
    assert.equal(params.year, 2026);
    assert.equal(params.month, 3);
    assert.equal(params.client, 11);
  });

  it('buildComissionRequestParams omits invalid month and empty client', () => {
    const params = buildComissionRequestParams({
      year: '2026',
      month: '0',
      receiverId: 7,
      clientId: '',
    });
    assert.equal(params.month, undefined);
    assert.equal(params.client, undefined);
    assert.equal(params.receiver, 7);
  });

  it('normalizeComissionList accepts array, member and hydra shapes', () => {
    assert.deepEqual(normalizeComissionList([{id: 1}]), [{id: 1}]);
    assert.deepEqual(normalizeComissionList({member: [{id: 2}]}), [{id: 2}]);
    assert.deepEqual(
      normalizeComissionList({'hydra:member': [{id: 3}]}),
      [{id: 3}],
    );
    assert.deepEqual(normalizeComissionList(null), []);
  });

  it('extractClientFromInvoice reads nested order.client', () => {
    const invoice = {
      id: 1,
      order: [{order: {client: {id: 99, name: 'Acme', alias: 'AC'}}}],
    };
    const client = extractClientFromInvoice(invoice);
    assert.equal(client.id, 99);
    assert.equal(client.name, 'Acme');
  });

  it('filterInvoicesByClient keeps only matching client', () => {
    const invoices = [
      {id: 1, order: [{order: {client: {id: 10, name: 'A'}}}]},
      {id: 2, order: [{order: {client: {id: 20, name: 'B'}}}]},
    ];
    const filtered = filterInvoicesByClient(invoices, 10);
    assert.equal(filtered.length, 1);
    assert.equal(filtered[0].id, 1);
  });

  it('groupCommissionsByMonth aggregates totals for seller receive', () => {
    const invoices = [
      {id: 1, price: 100, dueDate: '2026-03-10T12:00:00Z'},
      {id: 2, price: 50, dueDate: '2026-03-20T12:00:00Z'},
      {id: 3, price: 30, dueDate: '2026-04-05T12:00:00Z'},
    ];
    const rows = groupCommissionsByMonth(invoices, {
      selectedMonth: '0',
      year: 2026,
      monthLabelById: {3: 'Mar', 4: 'Abr'},
    });
    assert.equal(rows.length, 2);
    assert.equal(rows[0].month, 3);
    assert.equal(rows[0].total, 150);
    assert.equal(rows[0].count, 2);
    assert.equal(rows[1].month, 4);
    assert.equal(rows[1].total, 30);
  });

  it('groupCommissionsByMonth respects selectedMonth filter', () => {
    const invoices = [
      {id: 1, price: 100, dueDate: '2026-03-10T12:00:00Z'},
      {id: 2, price: 50, dueDate: '2026-04-10T12:00:00Z'},
    ];
    const rows = groupCommissionsByMonth(invoices, {
      selectedMonth: '3',
      year: 2026,
    });
    assert.equal(rows.length, 1);
    assert.equal(rows[0].month, 3);
  });

  it('collectClientsFromInvoices returns unique sorted clients', () => {
    const invoices = [
      {order: [{order: {client: {id: 2, name: 'Beta'}}}]},
      {order: [{order: {client: {id: 1, name: 'Alpha'}}}]},
      {order: [{order: {client: {id: 2, name: 'Beta'}}}]},
    ];
    const clients = collectClientsFromInvoices(invoices);
    assert.equal(clients.length, 2);
    assert.equal(clients[0].name, 'Alpha');
  });

  it('resolveInvoiceDate prefers dueDate', () => {
    const date = resolveInvoiceDate({dueDate: '2026-08-01T00:00:00Z'});
    assert.ok(date instanceof Date);
    assert.equal(date.getUTCFullYear(), 2026);
  });

  it('formatCurrency formats BRL', () => {
    const text = formatCurrency(12.5);
    assert.match(text, /12/);
  });

  it('buildMonthOptions returns 13 entries including all', () => {
    const options = buildMonthOptions(() => 'x');
    assert.equal(options.length, 13);
    assert.equal(options[0].id, '0');
  });
});

/**
 * Smoke: Franqueadora — Royalties a receber (ui-crm#23)
 * Navigates to RoyaltiesReceivablePage and asserts list shell loads
 * with receiver-scoped invoice request (mocked).
 *
 * Requires app-community browser harness (same pattern as ui-financial
 * financial-entries-create.spec.js). When run outside that harness,
 * this file documents the acceptance scenario for QA.
 */
const { expect, test } = require('playwright/test');

const API_ORIGIN =
  process.env.API_ORIGIN ||
  process.env.EXPO_PUBLIC_API_URL ||
  'https://api.controleonline.com';

const CORS_HEADERS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers':
    'API-TOKEN, APP-DOMAIN, DEVICE, ACCEPT, CONTENT-TYPE, X-Requested-With',
  'access-control-allow-methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
};

const jsonHeaders = () => ({
  ...CORS_HEADERS,
  'content-type': 'application/ld+json; charset=utf-8',
});

const collection = member => ({
  member,
  'hydra:member': member,
  totalItems: member.length,
  'hydra:totalItems': member.length,
  summary: {
    sum: { price: 150 },
    financial: { totalAmount: 150, openAmount: 150, paidAmount: 0 },
  },
});

const company = {
  id: 3,
  name: 'Franqueadora Teste',
  alias: 'FRANQ',
  panel_enabled: true,
  enabled: true,
  commercial_enabled: true,
  theme: { colors: { primary: '#0EA5E9' } },
};

const royaltyInvoice = {
  id: 501,
  invoiceType: 'invoice',
  price: 150,
  dueDate: '2026-08-20',
  payer: { id: 88, name: 'Franqueado Alpha', alias: 'ALPHA' },
  receiver: { id: 3, name: 'Franqueadora Teste', alias: 'FRANQ' },
  category: { id: 12, name: 'Royalties' },
  status: { id: 1, realStatus: 'open' },
};

test.describe('Royalties a receber (franqueadora)', () => {
  test('loads RoyaltiesReceivablePage and lists royalty invoices for receiver company', async ({
    page,
  }) => {
    let invoicesQuery = '';

    await page.route(`${API_ORIGIN}/**`, async route => {
      const request = route.request();
      const url = new URL(request.url());
      const pathname = url.pathname.replace(/^\/+/, '');
      const method = request.method().toUpperCase();

      if (method === 'OPTIONS') {
        return route.fulfill({ status: 204, headers: CORS_HEADERS, body: '' });
      }

      if (
        pathname === 'companies' ||
        pathname.startsWith('people/') ||
        pathname === 'people'
      ) {
        return route.fulfill({
          status: 200,
          headers: jsonHeaders(),
          body: JSON.stringify(company),
        });
      }

      if (pathname === 'invoices' || pathname.startsWith('invoices')) {
        invoicesQuery = url.search || '';
        return route.fulfill({
          status: 200,
          headers: jsonHeaders(),
          body: JSON.stringify(collection([royaltyInvoice])),
        });
      }

      return route.fulfill({
        status: 200,
        headers: jsonHeaders(),
        body: JSON.stringify({ member: [], 'hydra:member': [] }),
      });
    });

    // Deep-link / navigate as the app shell would for the registered route
    await page.goto(
      process.env.SMOKE_APP_URL ||
        'http://localhost:8081/?route=RoyaltiesReceivablePage',
    );

    // Shell: page testID or title
    const pageRoot = page.getByTestId('royalties-receivable-page').or(
      page.getByText(/Royalties a receber/i),
    );
    await expect(pageRoot.first()).toBeVisible({ timeout: 30000 });

    // Request should scope to receiver (franqueadora)
    expect(invoicesQuery).toMatch(/invoiceType=royalties|invoiceType%3Droyalties/);
    expect(invoicesQuery).toMatch(/receiver=3|receiver%3D3/);
  });
});

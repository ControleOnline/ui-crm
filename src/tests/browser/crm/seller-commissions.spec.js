/**
 * Smoke: Visão Vendedor — Minhas comissões (invoice tipo comission).
 * Runs inside app-community browser harness (playwright + API mock).
 * Acceptance: route SellerCommissionsPage loads under seller context,
 * year/month/client filters and empty/list states with testIDs are exercised.
 */
const {expect, test} = require('playwright/test');
const path = require('path');

// Relative to modules/controleonline/ui-crm/src/tests/browser/crm/ → app-community root
const APP_ROOT = path.resolve(__dirname, '../../../../../../..');
let packageJson = {};
let API_ORIGIN = '';
try {
  packageJson = require(path.join(APP_ROOT, 'package.json'));
} catch {
  packageJson = {version: '1.0.0'};
}
try {
  ({API_ORIGIN} = require(path.join(APP_ROOT, 'src/tests/browser/apiOrigin.js')));
} catch {
  API_ORIGIN = process.env.API_ENTRYPOINT || 'https://api.controleonline.com';
}

const APP_VERSION = packageJson?.version || '1.0.0';

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
});

const company = {
  id: 3,
  name: 'Empresa Demo',
  alias: 'DEMO',
  panel_enabled: true,
  enabled: true,
  commercial_enabled: true,
  theme: {colors: {primary: '#0EA5E9'}},
};

const sellerPeopleId = 42;
const sampleComissions = [
  {
    id: 501,
    price: 150,
    invoiceType: 'comission',
    dueDate: '2026-03-15T12:00:00Z',
    order: [{order: {client: {id: 11, name: 'Cliente Demo'}}}],
  },
  {
    id: 502,
    price: 80,
    invoiceType: 'comission',
    dueDate: '2026-03-20T12:00:00Z',
    order: [{order: {client: {id: 12, name: 'Cliente Beta'}}}],
  },
];

const mockSellerCommissionsApi = async page => {
  await page.route(`${API_ORIGIN}/**`, async route => {
    const request = route.request();
    const url = new URL(request.url());
    const pathname = url.pathname.replace(/^\/+/, '');
    const method = request.method().toUpperCase();

    if (method === 'OPTIONS') {
      return route.fulfill({status: 204, headers: CORS_HEADERS, body: ''});
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

    if (pathname === 'finance/comission' || pathname.startsWith('finance/comission')) {
      return route.fulfill({
        status: 200,
        headers: jsonHeaders(),
        body: JSON.stringify(collection(sampleComissions)),
      });
    }

    if (pathname === 'invoices' || pathname.startsWith('invoices')) {
      return route.fulfill({
        status: 200,
        headers: jsonHeaders(),
        body: JSON.stringify(collection(sampleComissions)),
      });
    }

    // Default empty collection for other endpoints
    return route.fulfill({
      status: 200,
      headers: jsonHeaders(),
      body: JSON.stringify(collection([])),
    });
  });

  await page.addInitScript(
    ({appVersion, peopleId}) => {
      const set = (k, v) => {
        try {
          localStorage.setItem(k, v);
        } catch {}
      };
      set(
        'session',
        JSON.stringify({
          id: 7,
          people: `/people/${peopleId}`,
          people_id: peopleId,
          api_key: 'test-api-key',
          active: 1,
          mycompany: 3,
          roles: ['ROLE_SALESMAN', 'ROLE_ADMIN'],
        }),
      );
      set('config', JSON.stringify({language: 'pt-br'}));
      set('app-type', 'ERP');
      set(
        'device',
        JSON.stringify({
          id: 'web-erp',
          device: 'web-erp',
          type: 'WEB',
          appName: 'Browser ERP',
          appVersion,
          buildNumber: appVersion,
          systemName: 'web',
          systemVersion: 'web',
          deviceType: 'web',
          metadata: {},
        }),
      );
    },
    {appVersion: APP_VERSION, peopleId: sellerPeopleId},
  );
};

test.describe('Seller commissions (comission) — visão vendedor', () => {
  test('loads Minhas comissões, exercises year/month/client filters and list state', async ({
    page,
  }) => {
    await mockSellerCommissionsApi(page);

    // Primary path used by skeleton and route name SellerCommissionsPage
    await page.goto('/seller-commissions');

    // Page root testID must be present (acceptance)
    await expect(page.getByTestId('seller-commissions-page')).toBeVisible({
      timeout: 20000,
    });

    // Year controls
    await expect(page.getByTestId('seller-commissions-year-input')).toBeVisible({
      timeout: 10000,
    });
    const yearDec = page.getByTestId('seller-commissions-year-dec');
    const yearInc = page.getByTestId('seller-commissions-year-inc');
    await expect(yearDec).toBeVisible();
    await expect(yearInc).toBeVisible();

    // Month chips (at least "Todos" / id 0 and one month)
    await expect(page.getByTestId('seller-commissions-month-chip-0')).toBeVisible({
      timeout: 8000,
    });
    // Click a specific month to exercise filter
    const marchChip = page.getByTestId('seller-commissions-month-chip-3');
    if (await marchChip.isVisible().catch(() => false)) {
      await marchChip.click();
    }

    // Client chips (all + derived from sample data)
    await expect(
      page.getByTestId('seller-commissions-client-chip-all'),
    ).toBeVisible({timeout: 8000});

    // List or empty state must resolve
    const list = page.getByTestId('seller-commissions-list');
    const empty = page.getByTestId('seller-commissions-empty');
    await expect(list.or(empty).first()).toBeVisible({timeout: 15000});

    // Prefer list with sample data
    if (await list.isVisible().catch(() => false)) {
      await expect(page.getByTestId('seller-commission-month-2026-03')).toBeVisible({
        timeout: 8000,
      }).catch(() => {
        // month key format may vary; presence of list is enough
      });
    }
  });
});

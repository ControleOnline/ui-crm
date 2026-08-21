const { expect, test } = require('playwright/test');
const { API_ORIGIN } = require('../../../../../../../src/tests/browser/apiOrigin');
const { version: appVersion } = require('../../../../../../../package.json');

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

const textHeaders = () => ({
  ...CORS_HEADERS,
  'content-type': 'text/css; charset=utf-8',
});

const collection = member => ({
  member,
  'hydra:member': member,
  totalItems: member.length,
  'hydra:totalItems': member.length,
});

const company = {
  '@id': '/people/2',
  id: 2,
  name: 'CONTROLE ONLINE',
  alias: 'CONTROLE ONLINE',
  panel_enabled: true,
  enabled: true,
  commercial_enabled: true,
  configs: {},
};

const statuses = [
  {
    '@id': '/statuses/1',
    id: 1,
    status: 'Aberto',
    realStatus: 'open',
    color: '#3b82f6',
  },
];

const categories = [
  { '@id': '/categories/1', id: 1, context: 'relationship', name: 'Comercial' },
  { '@id': '/categories/4', id: 4, context: 'relationship', name: 'Inbound' },
  {
    '@id': '/categories/2',
    id: 2,
    context: 'relationship-criticality',
    name: 'Normal',
  },
  {
    '@id': '/categories/3',
    id: 3,
    context: 'relationship-reason',
    name: 'Indicação',
  },
];

const people = [
  {
    '@id': '/people/31',
    id: 31,
    name: 'CLIENTE CATEGORIA',
    alias: 'CAT',
    peopleType: 'J',
  },
];

// API returns category as plain reference (not expanded) — the bug under test
const opportunities = [
  {
    id: 201,
    client: people[0],
    category: '/categories/4',
    criticality: '/categories/2',
    reason: '/categories/3',
    taskStatus: '/statuses/1',
    dueDate: '2026-08-20',
    alterDate: '2026-08-10',
    announce: '',
  },
];

const mockCrmApi = async page => {
  const savedPayloads = [];

  await page.route(`${API_ORIGIN}/**`, async route => {
    const request = route.request();
    const url = new URL(request.url());
    const pathname = url.pathname.replace(/^\/+/, '');

    if (request.method().toUpperCase() === 'OPTIONS') {
      return route.fulfill({ status: 204, headers: CORS_HEADERS, body: '' });
    }

    if (pathname === 'themes-colors.css') {
      return route.fulfill({
        status: 200,
        headers: textHeaders(),
        body: ':root { --primary: #1C8FBD; --secondary: #0169D9; }',
      });
    }

    if (pathname === 'runtime/ip') {
      return route.fulfill({
        status: 200,
        headers: jsonHeaders(),
        body: JSON.stringify({ ip: '127.0.0.1' }),
      });
    }

    if (pathname === 'people/companies/my') {
      return route.fulfill({
        status: 200,
        headers: jsonHeaders(),
        body: JSON.stringify(collection([company])),
      });
    }

    if (pathname === 'people/company/default') {
      return route.fulfill({
        status: 200,
        headers: jsonHeaders(),
        body: JSON.stringify(company),
      });
    }

    if (pathname === 'statuses') {
      return route.fulfill({
        status: 200,
        headers: jsonHeaders(),
        body: JSON.stringify(collection(statuses)),
      });
    }

    if (pathname === 'categories') {
      return route.fulfill({
        status: 200,
        headers: jsonHeaders(),
        body: JSON.stringify(collection(categories)),
      });
    }

    if (pathname === 'people') {
      return route.fulfill({
        status: 200,
        headers: jsonHeaders(),
        body: JSON.stringify(collection(people)),
      });
    }

    if (pathname === 'tasks' || pathname.startsWith('tasks/')) {
      if (request.method().toUpperCase() === 'PUT' || request.method().toUpperCase() === 'POST') {
        try {
          savedPayloads.push(JSON.parse(request.postData() || '{}'));
        } catch {
          savedPayloads.push({});
        }
        return route.fulfill({
          status: 200,
          headers: jsonHeaders(),
          body: JSON.stringify({ id: 201, ...opportunities[0] }),
        });
      }

      return route.fulfill({
        status: 200,
        headers: jsonHeaders(),
        body: JSON.stringify(collection(opportunities)),
      });
    }

    if (pathname === 'menus-people') {
      return route.fulfill({
        status: 200,
        headers: jsonHeaders(),
        body: JSON.stringify({ modules: {} }),
      });
    }

    if (pathname === 'configs/discovery-configs') {
      return route.fulfill({
        status: 200,
        headers: jsonHeaders(),
        body: JSON.stringify({ configs: {} }),
      });
    }

    return route.fulfill({
      status: 200,
      headers: jsonHeaders(),
      body: JSON.stringify(collection([])),
    });
  });

  await page.addInitScript(
    ({ version }) => {
      localStorage.setItem(
        'session',
        JSON.stringify({
          id: 19,
          people: 19,
          api_key: 'test-api-key',
          active: 1,
          mycompany: 2,
          roles: ['ROLE_SUPER'],
        }),
      );
      localStorage.setItem('app-type', 'CRM');
      localStorage.setItem('config', JSON.stringify({ language: 'pt-br' }));
      localStorage.setItem(
        'device',
        JSON.stringify({
          id: 'web-crm',
          device: 'web-crm',
          type: 'WEB',
          appName: 'Browser CRM',
          appVersion: version,
          buildNumber: version,
          systemName: 'web',
          systemVersion: 'web',
          deviceType: 'web',
          metadata: {},
        }),
      );
    },
    { version: appVersion },
  );

  return savedPayloads;
};

test.describe('crm opportunity category editor', () => {
  test('normalizes category reference when opening edit modal', async ({ page }) => {
    await mockCrmApi(page);

    await page.goto('/crm-index');

    await expect(page.getByText('CLIENTE CATEGORIA')).toBeVisible();

    // Open edit — UI typically exposes an edit control on the card
    const editTrigger = page
      .getByRole('button', { name: /edit|editar/i })
      .or(page.locator('[data-testid="edit-opportunity"]'))
      .or(page.locator('text=CLIENTE CATEGORIA').locator('..').getByRole('button').first());

    // Fallback: click any pencil / edit icon near the card
    if (await editTrigger.count()) {
      await editTrigger.first().click();
    } else {
      await page.locator('text=CLIENTE CATEGORIA').click({ button: 'right' }).catch(() => {});
      const pencil = page.locator('[class*="edit"], [name="edit"], [name="pencil"]').first();
      if (await pencil.count()) {
        await pencil.click();
      }
    }

    // After normalize, the expanded option name "Inbound" must appear in the form
    await expect(page.getByText('Inbound')).toBeVisible({ timeout: 10000 });
  });
});

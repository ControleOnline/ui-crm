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
    color: '#e67e22',
  },
  {
    '@id': '/statuses/2',
    id: 2,
    status: 'Fechado',
    realStatus: 'closed',
    color: '#10b981',
  },
];

const people = [
  {
    '@id': '/people/31',
    id: 31,
    name: 'OPORTUNIDADE ABERTA',
    alias: 'ABERTA',
    peopleType: 'J',
  },
  {
    '@id': '/people/32',
    id: 32,
    name: 'OPORTUNIDADE FECHADA',
    alias: 'FECHADA',
    peopleType: 'J',
  },
];

const opportunities = [
  {
    id: 101,
    client: people[0],
    category: { name: 'Comercial' },
    criticality: { name: 'Normal' },
    taskStatus: statuses[0],
    dueDate: '2026-08-20',
    alterDate: '2026-08-10',
    announce: '',
  },
  {
    id: 102,
    client: people[1],
    category: { name: 'Comercial' },
    criticality: { name: 'Normal' },
    taskStatus: statuses[1],
    dueDate: '2026-08-21',
    alterDate: '2026-08-10',
    announce: '',
  },
];

const mockCrmApi = async page => {
  const taskQueries = [];

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
        body: JSON.stringify(
          collection([
            { '@id': '/categories/1', id: 1, context: 'relationship', name: 'Comercial' },
            { '@id': '/categories/2', id: 2, context: 'relationship-criticality', name: 'Normal' },
            { '@id': '/categories/3', id: 3, context: 'relationship-reason', name: 'Indicação' },
          ]),
        ),
      });
    }

    if (pathname === 'people') {
      return route.fulfill({
        status: 200,
        headers: jsonHeaders(),
        body: JSON.stringify(collection(people)),
      });
    }

    if (pathname === 'tasks') {
      const query = Object.fromEntries(url.searchParams);
      taskQueries.push(query);
      const filtered = query.taskStatus
        ? opportunities.filter(item => item.taskStatus['@id'] === query.taskStatus)
        : opportunities;

      return route.fulfill({
        status: 200,
        headers: jsonHeaders(),
        body: JSON.stringify(collection(filtered)),
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

  return taskQueries;
};

test.describe('crm opportunities status filter', () => {
  test('keeps all selected and reloads without status filter', async ({ page }) => {
    const taskQueries = await mockCrmApi(page);

    await page.goto('/crm-index');

    await expect(page.getByText('OPORTUNIDADE ABERTA')).toBeVisible();
    await expect
      .poll(() => taskQueries.some(query => query.taskStatus === '/statuses/1'))
      .toBe(true);

    await page.getByText(/^(All|Todos)$/).click();

    await expect(page.getByText('OPORTUNIDADE FECHADA')).toBeVisible();
    await expect
      .poll(() => taskQueries.some(query => !Object.hasOwn(query, 'taskStatus')))
      .toBe(true);
  });
});
